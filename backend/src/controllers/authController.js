import { asyncRoute } from '../lib/errors.js';
import { clearSession, publicUser, setSession } from '../middleware/auth.js';
import * as authService from '../services/authService.js';

export const register = asyncRoute(async (req, res) => {
  const { record, user } = await authService.register(req.body ?? {});
  setSession(res, record);
  res.status(201).json({ user });
});

export const login = asyncRoute(async (req, res) => {
  const result = await authService.login(req.body ?? {});
  setSession(res, result.record);
  res.json({ user: result.user });
});

export function logout(_req, res) {
  clearSession(res);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}
