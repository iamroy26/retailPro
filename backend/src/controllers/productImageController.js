import { z } from 'zod';
import { AppError, asyncRoute } from '../lib/errors.js';
import { MAX_PRODUCT_IMAGE_BYTES } from '../lib/productImageSecurity.js';
import {
  importSelectedProductImage,
  searchProductImages,
  uploadProductImage,
} from '../services/productImageService.js';

const searchQuery = z.object({
  name: z.string().trim().max(180).optional().default(''),
  brand: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(120).optional().default(''),
  barcode: z.string().trim().max(32).regex(/^[\d]*$/, 'Barcode must contain only digits.').optional().default(''),
}).refine((value) => value.name || value.barcode, {
  message: 'Enter a product name or barcode to search for images.',
});

const importBody = z.object({
  selection_token: z.string().min(1).max(6000),
});

export const search = asyncRoute(async (req, res) => {
  const query = searchQuery.parse(req.query);
  res.json(await searchProductImages(query, req.user.id));
});

export const importSelected = asyncRoute(async (req, res) => {
  const body = importBody.parse(req.body);
  res.json(await importSelectedProductImage(req.user.id, body.selection_token));
});

export const upload = asyncRoute(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new AppError('Choose a JPEG, PNG, or WebP image to upload.');
  }
  if (req.body.length > MAX_PRODUCT_IMAGE_BYTES) throw new AppError('Product images must be 5 MB or smaller.');
  const contentType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    throw new AppError('Only JPEG, PNG, and WebP images are supported.');
  }
  res.json(await uploadProductImage(req.user.id, req.body, contentType));
});
