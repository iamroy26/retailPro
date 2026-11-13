import { asyncRoute } from '../lib/errors.js';
import { adjustStock } from '../services/inventoryService.js';

export const adjust = asyncRoute(async (req, res) => {
  res.json(await adjustStock(req.user.id, req.user, req.body ?? {}));
});
