import { AppError } from './errors.js';

export function requireObject(value, label = 'Request body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`${label} must be an object.`);
  }
  return value;
}

export function requiredText(value, label, { min = 1, max = 500 } = {}) {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) {
    throw new AppError(`${label} must be between ${min} and ${max} characters.`);
  }
  return text;
}

export function optionalText(value, label, max = 1000) {
  const text = String(value ?? '').trim();
  if (text.length > max) throw new AppError(`${label} must be no more than ${max} characters.`);
  return text;
}

export function finiteNumber(value, label, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    const qualifier = integer ? 'a whole number' : 'a valid number';
    throw new AppError(`${label} must be ${qualifier}${Number.isFinite(min) ? ` of at least ${min}` : ''}${Number.isFinite(max) ? ` and no more than ${max}` : ''}.`);
  }
  return number;
}

export function parseDate(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new AppError(`${label} must be a valid date.`);
  return date;
}

export function parseFilter(value) {
  if (!value) return {};
  let filter;
  try {
    filter = JSON.parse(value);
  } catch {
    throw new AppError('The filter must be valid JSON.');
  }
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new AppError('The filter must be a JSON object.');
  }
  return filter;
}

export function parseLimit(value, fallback = 50, maximum = 500) {
  const limit = Number.parseInt(value ?? '', 10);
  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, maximum) : fallback;
}

export function parseOffset(value) {
  const offset = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(offset) && offset > 0 ? Math.min(offset, 1_000_000) : 0;
}
