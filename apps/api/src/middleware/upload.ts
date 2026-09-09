import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { AppError } from './errorHandler';

const UPLOAD_DIR = env.UPLOAD_DIR ?? 'uploads';
const MAX_MB = env.MAX_FILE_SIZE_MB ?? 10;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── S3 Configuration ──────────────────────────────────────────────────────────
let s3Client: S3Client | null = null;
if (env.STORAGE_PROVIDER === 's3') {
  const config: any = {
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
    },
  };
  if (env.AWS_REGION) config.region = env.AWS_REGION;
  if (env.S3_ENDPOINT) {
    config.endpoint = env.S3_ENDPOINT;
    config.forcePathStyle = true;
  }
  s3Client = new S3Client(config);
}

// ── Multer local storage setup (acting as temporary storage for S3 uploads) ───
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm)|application\/pdf/;
  if (!allowed.test(file.mimetype)) {
    cb(new AppError(`File type '${file.mimetype}' not allowed`, 400, 'INVALID_FILE_TYPE'));
    return;
  }
  cb(null, true);
};

// ── Async S3 Uploader middleware ──────────────────────────────────────────────
async function uploadSingleFileToS3(file: Express.Multer.File): Promise<string> {
  if (!s3Client || !env.S3_BUCKET_NAME) {
    throw new Error('S3 Client or Bucket name is not configured.');
  }

  const fileStream = fs.createReadStream(file.path);
  const key = `uploads/${file.filename}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  // Clean up local temporary file asynchronously
  fs.unlink(file.path, (err) => {
    if (err) logger.error({ err, path: file.path }, 'Error deleting local temp file after S3 upload');
  });

  if (env.S3_ENDPOINT) {
    const cleanEndpoint = env.S3_ENDPOINT.replace(/\/$/, '');
    return `${cleanEndpoint}/${env.S3_BUCKET_NAME}/${key}`;
  }
  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

const uploadToS3 = async (req: Request, _res: Response, next: NextFunction) => {
  if (env.STORAGE_PROVIDER !== 's3' || !s3Client) {
    return next();
  }

  if (req.file) {
    try {
      (req.file as any).location = await uploadSingleFileToS3(req.file);
    } catch (err) {
      return next(err);
    }
  }

  if (req.files) {
    try {
      const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      await Promise.all(
        filesArray.map(async (file) => {
          (file as any).location = await uploadSingleFileToS3(file);
        })
      );
    } catch (err) {
      return next(err);
    }
  }

  next();
};

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

export const uploadSingle = [upload.single('file'), asyncHandler(uploadToS3)];
export const uploadMultiple = [upload.array('files', 10), asyncHandler(uploadToS3)];

export function getFileUrl(file?: Express.Multer.File): string {
  if (!file) return '';
  return (file as any).location ?? `/uploads/${file.filename}`;
}

export default upload;
