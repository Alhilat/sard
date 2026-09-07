import { randomBytes } from 'crypto';
import prisma from '../../lib/prisma';
import { hashPassword, comparePassword, hashToken } from '../../utils/hash';
import { signTokenPair, signAccessToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../../middleware/errorHandler';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../lib/email';
import { logger } from '../../lib/logger';

export async function register(data: {
  email: string;
  password: string;
  role: 'individual' | 'organization';
  full_name?: string;
  country?: string;
  legal_name?: string;
  display_name?: string;
  website?: string;
}) {
  const existing = await prisma.users.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('Email already registered');

  const roleRecord = await prisma.roles.findFirst({ where: { name: data.role } });
  if (!roleRecord) throw new AppError('Role not configured', 500);

  const password_hash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.users.create({
      data: {
        email: data.email,
        password_hash,
        role_id: roleRecord.id,
        status: 'pending_verification',
      },
    });

    if (data.role === 'individual') {
      await tx.individual_profiles.create({
        data: { user_id: newUser.id, full_name: data.full_name!, country: data.country },
      });
    } else {
      await tx.organizations.create({
        data: {
          user_id: newUser.id,
          legal_name: data.legal_name!,
          display_name: data.display_name!,
          website: data.website,
        },
      });
    }

    // Create email verification token
    const rawToken = randomBytes(32).toString('hex');
    await tx.email_verification_tokens.create({
      data: {
        user_id: newUser.id,
        token_hash: hashToken(rawToken),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { user: newUser, verificationToken: rawToken };
  });

  // Send verification email asynchronously
  sendVerificationEmail(data.email, user.verificationToken).catch((err) => {
    logger.error({ err }, 'Failed to send verification email');
  });

  return {
    message: 'Registration successful. Check your email to verify your account.',
    userId: user.user.id,
    ...(process.env.NODE_ENV === 'development' ? { verificationToken: user.verificationToken } : {}),
  };
}

export async function login(email: string, password: string, deviceInfo?: string) {
  const user = await prisma.users.findUnique({
    where: { email },
    include: { roles: true },
  });
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (user.status === 'banned') throw new AppError('Account banned', 403, 'BANNED');
  if (user.status === 'suspended') throw new AppError('Account suspended', 403, 'SUSPENDED');

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const payload = { userId: user.id, email: user.email, roleId: user.role_id, roleName: user.roles.name };
  const tokens = signTokenPair(payload);

  await prisma.$transaction([
    prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(tokens.refreshToken),
        device_info: deviceInfo,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    }),
  ]);

  return { ...tokens, role: user.roles.name };
}

export async function logout(userId: string, refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refresh_tokens.updateMany({
    where: { user_id: userId, token_hash: tokenHash, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

export async function refreshTokens(rawToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refresh_tokens.findFirst({
    where: { user_id: payload.userId, token_hash: tokenHash, revoked_at: null },
  });
  if (!stored || stored.expires_at < new Date()) throw new UnauthorizedError('Refresh token expired or revoked');

  // Rotate: revoke old, issue new
  const newRawRefresh = randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.refresh_tokens.update({ where: { id: stored.id }, data: { revoked_at: new Date() } }),
    prisma.refresh_tokens.create({
      data: {
        user_id: payload.userId,
        token_hash: hashToken(newRawRefresh),
        device_info: stored.device_info,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const accessToken = signAccessToken(payload);
  return { accessToken, refreshToken: newRawRefresh };
}

export async function forgotPassword(email: string) {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return { message: 'If that email is registered, a reset link has been sent.' };

  // Invalidate previous tokens
  await prisma.password_reset_tokens.deleteMany({ where: { user_id: user.id, used_at: null } });

  const rawToken = randomBytes(32).toString('hex');
  await prisma.password_reset_tokens.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // Send reset email asynchronously
  sendPasswordResetEmail(email, rawToken).catch((err) => {
    logger.error({ err }, 'Failed to send password reset email');
  });

  return {
    message: 'If that email is registered, a reset link has been sent.',
    ...(process.env.NODE_ENV === 'development' ? { resetToken: rawToken } : {}),
  };
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.password_reset_tokens.findFirst({
    where: { token_hash: tokenHash, used_at: null },
  });
  if (!record || record.expires_at < new Date()) throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');

  const password_hash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.users.update({ where: { id: record.user_id }, data: { password_hash } }),
    prisma.password_reset_tokens.update({ where: { id: record.id }, data: { used_at: new Date() } }),
    // Revoke all refresh tokens
    prisma.refresh_tokens.updateMany({ where: { user_id: record.user_id }, data: { revoked_at: new Date() } }),
  ]);

  return { message: 'Password reset successfully. Please log in.' };
}

export async function verifyEmail(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.email_verification_tokens.findFirst({
    where: { token_hash: tokenHash, used_at: null },
  });
  if (!record || record.expires_at < new Date()) throw new AppError('Invalid or expired token', 400, 'INVALID_TOKEN');

  await prisma.$transaction([
    prisma.users.update({
      where: { id: record.user_id },
      data: { email_verified_at: new Date(), status: 'active' },
    }),
    prisma.email_verification_tokens.update({ where: { id: record.id }, data: { used_at: new Date() } }),
  ]);

  return { message: 'Email verified successfully.' };
}

export async function getMe(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId, deleted_at: null },
    include: {
      roles: true,
      individual_profiles: { include: { media_files: true } },
      organizations: { include: { media_files_organizations_logo_media_idTomedia_files: true } },
    },
  });
  if (!user) throw new NotFoundError('User');
  const { password_hash: _, ...safe } = user;
  return safe;
}
