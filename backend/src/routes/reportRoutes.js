import { Router } from 'express';
import { report } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { reportQuery } from '../lib/requestSchemas.js';

const router = Router();
router.get('/reports', requireAuth, validateRequest({ query: reportQuery }), report);

export default router;
