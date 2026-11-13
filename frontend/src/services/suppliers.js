import { retailApi } from '@/api/retailApi';

function supplierQuery(search) {
  const term = search.trim();
  if (!term) return {};
  const like = { $regex: term, $options: 'i' };
  return { $or: [{ name: like }, { contact_person: like }, { phone: like }] };
}

export async function listSuppliers({ search = '', limit = 50, cursor = null } = {}) {
  const options = { sort: 'name', limit };
  if (cursor) options.cursor = cursor;
  return retailApi.entities.Supplier.filter(supplierQuery(search), options);
}

export async function createSupplier(data) {
  return retailApi.entities.Supplier.create(data);
}

export async function updateSupplier(id, data) {
  return retailApi.entities.Supplier.update(id, data);
}

export async function deleteSupplier(id) {
  return retailApi.entities.Supplier.delete(id);
}

/** Stock received from a supplier is recorded as a purchase movement. */
export async function listSupplierPurchases(supplierName, limit = 20) {
  return retailApi.entities.StockMovement.filter(
    { type: 'purchase', reason: { $regex: supplierName, $options: 'i' } },
    { sort: '-created_date', limit },
  );
}
