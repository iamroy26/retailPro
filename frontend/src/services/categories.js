import { retailApi } from '@/api/retailApi';

export async function listCategories({ includeInactive = true, limit = 100 } = {}) {
  const query = includeInactive ? {} : { is_active: true };
  return retailApi.entities.Category.filter(query, { sort: 'name', limit });
}

export async function createCategory(data) {
  return retailApi.entities.Category.create(data);
}

export async function updateCategory(id, data) {
  return retailApi.entities.Category.update(id, data);
}

export async function deleteCategory(id) {
  return retailApi.entities.Category.delete(id);
}

/** How many products sit in each category, for the categories screen. */
export async function categoryUsage(categoryName) {
  return retailApi.entities.Product.count({ category: categoryName, is_archived: false });
}
