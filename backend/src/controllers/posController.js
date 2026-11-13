import { asyncRoute } from '../lib/errors.js';
import { completeSale } from '../services/posService.js';

export const complete = asyncRoute(async (req, res) => {
  res.status(201).json(await completeSale(req.user.id, req.user, req.body ?? {}));
});
