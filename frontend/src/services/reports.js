import { apiClient } from './apiClient';

/**
 * The backend calculates full-range report totals and product rankings so the
 * report does not silently stop at the current page size.
 */
export async function getReportsData({ from, to, lowStockThreshold = 5, days = 30 }) {
  const params = new URLSearchParams({
    from,
    ...(to ? { to } : {}),
    low_stock_threshold: String(lowStockThreshold),
    days: String(days),
  });
  return apiClient.get(`/api/reports?${params.toString()}`);
}
