import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { AppError, asyncRoute } from '../lib/errors.js';

export const SESSION_COOKIE = 'retailpos_session';
const sessionDays = 7;

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role?.code ?? 'admin',
    created_date: user.created_date,
  };
}

export function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
    expiresIn: `${sessionDays}d`,
    issuer: 'retailpos-api',
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.production,
    sameSite: config.cookieSameSite,
    path: '/',
    maxAge: sessionDays * 24 * 60 * 60 * 1000,
  });
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: config.production,
    sameSite: config.cookieSameSite,
    path: '/',
  });
}

export const requireAuth = asyncRoute(async (req, res, next) => {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) throw new AppError('Please sign in to continue.', 401);

  let claims;
  try {
    claims = jwt.verify(token, config.jwtSecret, { issuer: 'retailpos-api' });
  } catch {
    clearSession(res);
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { role: true },
  });
  if (!user) {
    clearSession(res);
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }
  req.user = user;
  next();
});

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role.code)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
