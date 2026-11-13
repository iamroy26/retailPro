import { retailApi } from '@/api/retailApi';

function contactQuery(search, fields) {
  const term = search.trim();
  if (!term) return {};
  const like = { $regex: term, $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: like })) };
}

export async function listCustomers({ search = '', limit = 50, cursor = null } = {}) {
  const options = { sort: 'name', limit };
  if (cursor) options.cursor = cursor;
  return retailApi.entities.Customer.filter(contactQuery(search, ['name', 'phone', 'email']), options);
}

export async function createCustomer(data) {
  return retailApi.entities.Customer.create(data);
}

export async function updateCustomer(id, data) {
  return retailApi.entities.Customer.update(id, data);
}

export async function deleteCustomer(id) {
  return retailApi.entities.Customer.delete(id);
}
