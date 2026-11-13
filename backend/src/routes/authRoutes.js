import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginBody, registerBody } from '../lib/requestSchemas.js';

const router = Router();

router.post('/register', validateRequest({ body: registerBody }), authController.register);
router.post('/login', validateRequest({ body: loginBody }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
