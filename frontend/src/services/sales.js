import { retailApi } from '@/api/retailApi';
import { ApiError } from './apiClient';

export const SALE_PAGE_SIZE = 20;

export const DATE_RANGES = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Turns a range preset into the ISO bounds the query needs. */
export function resolveDateRange(preset, { from = null, to = null } = {}) {
  if (preset === 'custom') {
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59.999`) : null;
    return { from: start ? start.toISOString() : null, to: end ? end.toISOString() : null };
  }
  if (preset === 'all') return { from: null, to: null };

  const days = preset === 'today' ? 0 : Number(String(preset).replace('d', '')) - 1;
  const start = startOfToday();
  start.setDate(start.getDate() - (Number.isFinite(days) ? days : 0));
  return { from: start.toISOString(), to: null };
}

function buildSalesQuery({ from, to, search = '', paymentMethod = 'all' }) {
  const query = {};
  if (from || to) {
    query.sale_date = {};
    if (from) query.sale_date.$gte = from;
    if (to) query.sale_date.$lte = to;
  }
  if (paymentMethod && paymentMethod !== 'all') query.payment_method = paymentMethod;
  const term = search.trim();
  if (term) {
    const like = { $regex: term, $options: 'i' };
    query.$or = [{ receipt_number: like }, { customer_name: like }, { cashier_name: like }];
  }
  return query;
}

export async function listSales({
  from = null,
  to = null,
  search = '',
  paymentMethod = 'all',
  limit = SALE_PAGE_SIZE,
  cursor = null,
} = {}) {
  const options = { sort: '-sale_date', limit };
  if (cursor) options.cursor = cursor;
  return retailApi.entities.Sale.filter(buildSalesQuery({ from, to, search, paymentMethod }), options);
}

export async function listSalesForReport({ from, to, limit = 1000 }) {
  return retailApi.entities.Sale.filter({ status: 'completed', sale_date: { $gte: from, $lte: to } }, { sort: '-sale_date', limit });
}

export async function getSale(id) {
  return retailApi.entities.Sale.get(id);
}

/**
 * Totals for the current filter are aggregated on the server â€” never summed
 * from whichever page of rows happens to be loaded.
 */
export async function summariseSalesRange({ from = null, to = null, search = '', paymentMethod = 'all' } = {}) {
  const query = { ...buildSalesQuery({ from, to, search, paymentMethod }), status: 'completed' };
  const [aggregate, transactions] = await Promise.all([
    retailApi.entities.Sale.aggregate({ query, sum: ['total', 'gross_profit'] }),
    retailApi.entities.Sale.count(query),
  ]);
  const row = aggregate?.rows?.[0] ?? {};
  return {
    revenue: row.sum_total ?? 0,
    profit: row.sum_gross_profit ?? 0,
    transactions: transactions ?? 0,
  };
}

function toApiError(error) {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'The sale could not be completed.';
  const status = error?.response?.status ?? 0;
  const kind = status === 401 || status === 403 ? 'unauthorized' : status === 400 ? 'validation' : 'server';
  return new ApiError(message, { status, kind });
}

/**
 * A sale is only recorded once the server has re-priced the cart from stored
 * product records, checked stock and written the stock movements. The client
 * never sends prices or totals â€” those are the server's business.
 * When the Express API is configured, this call moves there instead.
 */
export async function createSale(payload) {
  try {
    const response = await retailApi.functions.invoke('processSale', payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
