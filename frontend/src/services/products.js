import { retailApi } from '@/api/retailApi';
import { apiClient } from './apiClient';

/**
 * Product data access. Every screen goes through here, so pointing this module
 * at the Express API later is a change in one place.
 */

export const PRODUCT_PAGE_SIZE = 24;

export const PRODUCT_SORTS = {
  name_asc: { label: 'Name (Aâ€“Z)', value: 'name' },
  name_desc: { label: 'Name (Zâ€“A)', value: '-name' },
  price_asc: { label: 'Price (low â†’ high)', value: 'selling_price' },
  price_desc: { label: 'Price (high â†’ low)', value: '-selling_price' },
  stock_asc: { label: 'Stock (low â†’ high)', value: 'stock_quantity' },
  newest: { label: 'Recently added', value: '-created_date' },
};

export const STOCK_FILTERS = {
  all: 'All stock levels',
  in: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
};

function searchFilter(term) {
  const clean = term.trim();
  if (!clean) return null;
  const like = { $regex: clean, $options: 'i' };
  return { $or: [{ name: like }, { sku: like }, { barcode: like }, { category: like }] };
}

function buildQuery({ search = '', category = 'all', stockFilter = 'all', includeArchived = false, lowStockThreshold = 5 }) {
  const query = {};
  if (!includeArchived) query.is_archived = false;
  if (category && category !== 'all') query.category = category;

  if (stockFilter === 'out') query.stock_quantity = { $lte: 0 };
  else if (stockFilter === 'low') query.stock_quantity = { $gt: 0, $lte: Number(lowStockThreshold) || 5 };
  else if (stockFilter === 'in') query.stock_quantity = { $gt: Number(lowStockThreshold) || 5 };

  const searchClause = searchFilter(search);
  return searchClause ? { ...query, ...searchClause } : query;
}

export async function listProducts({
  search = '',
  category = 'all',
  stockFilter = 'all',
  sort = 'name_asc',
  includeArchived = false,
  lowStockThreshold = 5,
  limit = PRODUCT_PAGE_SIZE,
  cursor = null,
} = {}) {
  const query = buildQuery({ search, category, stockFilter, includeArchived, lowStockThreshold });
  const options = { sort: PRODUCT_SORTS[sort]?.value ?? 'name', limit };
  if (cursor) options.cursor = cursor;
  return retailApi.entities.Product.filter(query, options);
}

/** The POS grid loads a bounded working set of sellable products. */
export async function listSellableProducts({ search = '', category = 'all', limit = 120 } = {}) {
  const query = buildQuery({ search, category, stockFilter: 'all' });
  return retailApi.entities.Product.filter(query, { sort: 'name', limit });
}

export async function listActiveProducts(limit = 400) {
  return retailApi.entities.Product.filter({ is_archived: false }, { sort: 'name', limit });
}

export async function getProduct(id) {
  return retailApi.entities.Product.get(id);
}

/** Barcode scanners type a code and press Enter â€” this resolves it to a product. */
export async function findProductByCode(code) {
  const value = String(code ?? '').trim();
  if (!value) return null;
  const { items } = await retailApi.entities.Product.filter(
    { is_archived: false, $or: [{ barcode: value }, { sku: value }] },
    { limit: 1 },
  );
  return items?.[0] ?? null;
}

export async function createProduct(data) {
  return retailApi.entities.Product.create({ ...data, is_archived: false });
}

export async function searchProductImages({ name, brand, category, barcode }, signal) {
  const query = new URLSearchParams({ name, brand, category, barcode });
  return apiClient.get(`/api/products/image-search?${query}`, { signal });
}

export async function importSelectedProductImage(selectionToken) {
  return apiClient.post('/api/products/images/import', { selection_token: selectionToken });
}

export async function uploadProductImage(file) {
  return apiClient.request('/api/products/images/upload', {
    method: 'POST',
    rawBody: file,
    headers: { 'Content-Type': file.type },
  });
}

export async function updateProduct(id, data) {
  return retailApi.entities.Product.update(id, data);
}

export async function setProductArchived(id, archived) {
  return retailApi.entities.Product.update(id, { is_archived: archived });
}

export async function deleteProduct(id) {
  return retailApi.entities.Product.delete(id);
}
