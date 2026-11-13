import { asyncRoute } from '../lib/errors.js';
import { getReport } from '../services/reportService.js';

export const report = asyncRoute(async (req, res) => {
  res.json(await getReport(req.user.id, req.validatedQuery ?? req.query));
});
