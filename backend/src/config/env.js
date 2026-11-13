import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env. Use the connection string from your Neon project.');
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set in backend/.env to a random value of at least 32 characters.');
}

const imageStorageRegion = process.env.IMAGE_STORAGE_REGION?.trim() || 'us-east-1';
const imageStorageEndpoint = process.env.IMAGE_STORAGE_ENDPOINT?.trim() || `https://s3.${imageStorageRegion}.amazonaws.com`;
const imageStorageBucket = process.env.IMAGE_STORAGE_BUCKET?.trim() || '';
const imageStorageAccessKeyId = process.env.IMAGE_STORAGE_ACCESS_KEY_ID?.trim() || '';
const imageStorageSecretAccessKey = process.env.IMAGE_STORAGE_SECRET_ACCESS_KEY?.trim() || '';
const imageStoragePublicBaseUrl = process.env.IMAGE_STORAGE_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') || '';

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret,
  webOrigins: (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  cookieSameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  production: process.env.NODE_ENV === 'production',
  imageStorage: {
    endpoint: imageStorageEndpoint,
    region: imageStorageRegion,
    bucket: imageStorageBucket,
    accessKeyId: imageStorageAccessKeyId,
    secretAccessKey: imageStorageSecretAccessKey,
    publicBaseUrl: imageStoragePublicBaseUrl,
    configured: Boolean(
      imageStorageBucket &&
      imageStorageAccessKeyId &&
      imageStorageSecretAccessKey &&
      imageStoragePublicBaseUrl
    ),
  },
};
