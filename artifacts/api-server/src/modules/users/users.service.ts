import type { Prisma } from '../../generated/prisma/client';
import prisma from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../utils/hash';
import { NotFoundError, ForbiddenError, AppError, ConflictError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function getUser(targetId: string) {
  const user = await prisma.users.findUnique({
    where: { id: targetId, deleted_at: null },
    select: {
      id: true, email: true, status: true, created_at: true,
      roles: { select: { name: true } },
      individual_profiles: {
        select: { full_name: true, bio: true, country: true, interests: true, avatar_media_id: true }
      },
      organizations: {
        select: { id: true, display_name: true, legal_name: true, description: true, website: true, verification_status: true }
      },
    },
  });
  if (!user) throw new NotFoundError('User');
  return user;
}

export async function updateProfile(userId: string, data: {
  full_name?: string; bio?: string; country?: string;
  interests?: string[]; privacy_settings?: Prisma.InputJsonValue;
}) {
  const profile = await prisma.individual_profiles.findUnique({ where: { user_id: userId } });
  if (!profile) throw new NotFoundError('Individual profile');
  return prisma.individual_profiles.update({
    where: { user_id: userId },
    data: { ...data, updated_at: new Date() } as Prisma.individual_profilesUpdateInput,
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  const valid = await comparePassword(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');
  const password_hash = await hashPassword(newPassword);
  await prisma.users.update({ where: { id: userId }, data: { password_hash, updated_at: new Date() } });
  return { message: 'Password changed successfully' };
}

export async function softDeleteAccount(userId: string) {
  await prisma.users.update({
    where: { id: userId },
    data: { deleted_at: new Date(), status: 'suspended', updated_at: new Date() },
  });
  return { message: 'Account deleted' };
}

export async function setAvatar(userId: string, fileUrl: string, mimeType: string, sizeBytes: number) {
  const media = await prisma.media_files.create({
    data: { uploader_id: userId, file_url: fileUrl, file_type: 'image', mime_type: mimeType, size_bytes: BigInt(sizeBytes) },
  });
  await prisma.individual_profiles.update({
    where: { user_id: userId },
    data: { avatar_media_id: media.id, updated_at: new Date() },
  });
  return { avatar_url: fileUrl, media_id: media.id };
}

export async function followEntity(followerId: string, followableType: 'user' | 'group', followableId: string) {
  const existing = await prisma.follows.findFirst({
    where: { follower_id: followerId, followable_type: followableType, followable_id: followableId },
  });
  if (existing) throw new ConflictError('Already following');
  return prisma.follows.create({
    data: { follower_id: followerId, followable_type: followableType, followable_id: followableId },
  });
}

export async function unfollowEntity(followerId: string, followableType: 'user' | 'group', followableId: string) {
  const record = await prisma.follows.findFirst({
    where: { follower_id: followerId, followable_type: followableType, followable_id: followableId },
  });
  if (!record) throw new NotFoundError('Follow');
  await prisma.follows.delete({ where: { id: record.id } });
  return { message: 'Unfollowed' };
}

export async function getUserPosts(targetId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const [posts, total] = await Promise.all([
    prisma.posts.findMany({
      where: { author_id: targetId, deleted_at: null, status: 'published' },
      orderBy: { created_at: 'desc' },
      skip, take,
    }),
    prisma.posts.count({ where: { author_id: targetId, deleted_at: null, status: 'published' } }),
  ]);
  return { posts, pagination: buildPagination(page, limit, total) };
}
