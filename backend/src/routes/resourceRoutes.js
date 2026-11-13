import { Router } from 'express';
import * as controller from '../controllers/resourceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function settingsWriteAccess(req, res, next) {
  if (req.params.resource === 'app-settings') return requireRole('admin')(req, res, next);
  next();
}

router.get('/:resource/count', controller.count);
router.get('/:resource/aggregate', controller.aggregate);
router.get('/:resource', controller.list);
router.post('/:resource', settingsWriteAccess, controller.create);
router.delete('/:resource', settingsWriteAccess, controller.removeMany);

router.get('/suppliers/:id/purchases', controller.supplierPurchases);
router.get('/:resource/:id', controller.get);
router.patch('/:resource/:id', settingsWriteAccess, controller.update);
router.delete('/:resource/:id', settingsWriteAccess, controller.remove);

export default router;
