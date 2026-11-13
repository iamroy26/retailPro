import { format, parseISO, isValid } from 'date-fns';

export const DEFAULT_CURRENCY = 'GHS';

/**
 * Money is always shown as "GHS 12.50" — the form Ghanaian retailers expect.
 * Unavailable figures are rendered as an em dash rather than a fake zero.
 */
export function formatCurrency(value, currency = DEFAULT_CURRENCY) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  const formatted = amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export function formatCompactCurrency(value, currency = DEFAULT_CURRENCY) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  if (Math.abs(amount) >= 1000000) return `${currency} ${(amount / 1000000).toFixed(1)}m`;
  if (Math.abs(amount) >= 1000) return `${currency} ${(amount / 1000).toFixed(1)}k`;
  return `${currency} ${amount.toFixed(0)}`;
}

export function formatNumber(value, options = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return amount.toLocaleString('en-GH', options);
}

export function formatQuantity(value, unit) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  const rounded = Number.isInteger(amount) ? amount : amount.toFixed(2);
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

function toDate(value) {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

export function formatDate(value, pattern = 'd MMM yyyy') {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
}

export function formatDateTime(value) {
  return formatDate(value, 'd MMM yyyy · HH:mm');
}

export function formatTime(value) {
  return formatDate(value, 'HH:mm');
}

export function formatDayShort(value) {
  return formatDate(value, 'EEE d');
}

export function toISODateInput(value) {
  const date = toDate(value);
  return date ? format(date, 'yyyy-MM-dd') : '';
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', hint: 'Enter amount received to work out change' },
  { value: 'card', label: 'Card', hint: 'Settled on the card terminal' },
  { value: 'mobile_money', label: 'Mobile Money', hint: 'MTN MoMo, Telecel Cash, AT Money' },
];

export function paymentMethodLabel(value) {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? 'Unrecorded';
}

export function initialsOf(value) {
  if (!value) return '—';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}