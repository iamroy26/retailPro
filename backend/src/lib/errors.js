export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
