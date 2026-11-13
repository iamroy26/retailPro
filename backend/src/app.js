import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import posRoutes from './routes/posRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import productImageRoutes from './routes/productImageRoutes.js';
import { AppError } from './lib/errors.js';
import { prisma } from './db/prisma.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: config.webOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get(['/api/health', '/api/v1/health'], async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'online', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'offline', database: 'unavailable' });
  }
});

app.use(['/api/auth', '/api/v1/auth'], authRoutes);
app.use(['/api', '/api/v1'], posRoutes);
app.use(['/api', '/api/v1'], inventoryRoutes);
app.use(['/api', '/api/v1'], reportRoutes);
app.use(['/api', '/api/v1'], productImageRoutes);
app.use(['/api', '/api/v1'], resourceRoutes);

app.use((_req, _res, next) => next(new AppError('Route not found.', 404)));

export function apiErrorHandler(error, req, res, _next) {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Product images must be 5 MB or smaller.' });
  }
  if (error.name === 'ZodError' && Array.isArray(error.issues)) {
    return res.status(400).json({
      error: 'Request validation failed.',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (error instanceof AppError) return res.status(error.status).json({ error: error.message });
  if (error.code === 'P2021' || error.code === 'P2022') {
    console.error('API request failed', {
      method: req.method,
      path: req.path,
      name: error.name,
      code: error.code,
      modelName: error.meta?.modelName,
      column: error.meta?.column,
      message: error.message,
    });
    return res.status(503).json({
      error: 'The database schema is not up to date. Contact an administrator to apply pending migrations.',
    });
  }
  if (error.code === 'P2002') return res.status(409).json({ error: 'A record with those details already exists.' });
  if (error.code === 'P2003' || error.code === 'P2014') {
    return res.status(409).json({ error: 'This record is still in use and cannot be deleted.' });
  }
  if (error.code === 'P2025') return res.status(404).json({ error: 'Record not found.' });
  const databaseErrorCode = error.meta?.code ?? error.code;
  if (error.code === 'P2023' || databaseErrorCode === '22P02') {
    return res.status(400).json({ error: 'A supplied ID or value is not valid.' });
  }
  console.error('API request failed', {
    method: req.method,
    path: req.path,
    name: error.name,
    code: error.code,
    databaseCode: error.meta?.code,
    modelName: error.meta?.modelName,
    message: error.message,
    stack: error.stack,
  });
  return res.status(500).json({
    error: 'The server could not complete the request. Please try again, and contact support if the problem continues.',
  });
}

app.use(apiErrorHandler);
