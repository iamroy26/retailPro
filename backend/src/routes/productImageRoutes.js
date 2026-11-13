import express, { Router } from 'express';
import * as controller from '../controllers/productImageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/products/image-search', controller.search);
router.post('/products/images/import', controller.importSelected);
router.post(
  '/products/images/upload',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }),
  controller.upload,
);

export default router;
