import { env } from '../config/env';
import { logger } from './logger';

export async function sendEmail(options: { to: string; subject: string; html: string; text?: string }) {
  const { to, subject, html, text } = options;

  if (env.EMAIL_PROVIDER === 'console') {
    logger.info({ to, subject, body: text ?? html }, 'Email sent to console (Dev Mode)');
    return;
  }

  if (env.EMAIL_PROVIDER === 'resend') {
    if (!env.RESEND_API_KEY) {
      logger.error('RESEND_API_KEY is not configured. Email not sent.');
      throw new Error('Email configuration error');
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [to],
          subject,
          html,
          text: text ?? html.replace(/<[^>]*>/g, ''),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error({ errText }, 'Resend API returned error');
        throw new Error(`Resend email delivery failed: ${response.statusText}`);
      }

      logger.info({ to, subject }, 'Email sent successfully via Resend');
    } catch (err) {
      logger.error({ err }, 'Error sending email via Resend');
      throw err;
    }
    return;
  }

  if (env.EMAIL_PROVIDER === 'smtp') {
    // If user rejected installing nodemailer, we fallback to console logging with warning
    logger.warn({ to, subject }, 'SMTP provider selected but nodemailer package is not installed. Logging email to console instead.');
    logger.info({ to, subject, body: text ?? html }, 'SMTP Fallback Log');
    return;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const verificationLink = `${env.NODE_ENV === 'production' ? 'https://your-production-app.com' : 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const subject = 'Verify your email address';
  const html = `
    <h2>Welcome to our Platform!</h2>
    <p>Please click the link below to verify your email address and activate your account:</p>
    <p><a href="${verificationLink}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
    <p>If you did not request this email, please ignore it.</p>
  `;
  
  return sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${env.NODE_ENV === 'production' ? 'https://your-production-app.com' : 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const subject = 'Reset your password';
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Click the link below to set a new password:</p>
    <p><a href="${resetLink}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
    <p>This link is valid for 1 hour. If you did not request this reset, you can safely ignore this email.</p>
  `;
  
  return sendEmail({ to, subject, html });
}
