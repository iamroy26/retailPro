import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { stockAdjustmentBody } from '../lib/requestSchemas.js';

const router = Router();
router.post('/stock-adjustments', requireAuth, validateRequest({ body: stockAdjustmentBody }), inventoryController.adjust);

export default router;
