import { Router } from 'express';
import * as posController from '../controllers/posController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { saleBody } from '../lib/requestSchemas.js';

const router = Router();
router.post('/sales/complete', requireAuth, validateRequest({ body: saleBody }), posController.complete);

export default router;
