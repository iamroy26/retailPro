import { retailApi } from '@/api/retailApi';
import { ApiError } from './apiClient';

export const MOVEMENT_PAGE_SIZE = 20;

export const MOVEMENT_TYPES = {
  purchase: 'Stock purchase',
  adjustment: 'Manual adjustment',
  return: 'Customer return',
  damage: 'Damage / loss',
  sale: 'Sale',
};

export async function listMovements({ productId = null, type = 'all', limit = MOVEMENT_PAGE_SIZE, cursor = null } = {}) {
  const query = {};
  if (productId) query.product_id = productId;
  if (type && type !== 'all') query.type = type;
  const options = { sort: '-created_date', limit };
  if (cursor) options.cursor = cursor;
  return retailApi.entities.StockMovement.filter(query, options);
}

export async function listLowStockProducts({ threshold = 5, limit = 100 } = {}) {
  return retailApi.entities.Product.filter(
    { is_archived: false, stock_quantity: { $lte: Number(threshold) || 5 } },
    { sort: 'stock_quantity', limit },
  );
}

function toApiError(error) {
  const message =
    error?.response?.data?.error || error?.message || 'The stock adjustment could not be saved.';
  const status = error?.response?.status ?? 0;
  return new ApiError(message, { status, kind: status === 400 ? 'validation' : 'server' });
}

/**
 * Stock never changes silently: the server writes the new quantity and the
 * matching history entry together, and refuses an adjustment with no reason.
 */
export async function adjustStock({ product_id, mode = 'set', quantity, reason, type = 'adjustment', reference }) {
  try {
    const response = await retailApi.functions.invoke('adjustStock', {
      product_id,
      mode,
      quantity,
      reason,
      type,
      reference,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}