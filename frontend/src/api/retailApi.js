import { apiClient } from '@/services/apiClient';

const resourcePaths = {
  Product: 'products', Category: 'categories', Customer: 'customers', Supplier: 'suppliers',
  Expense: 'expenses', Sale: 'sales', StockMovement: 'stock-movements', AppSettings: 'app-settings',
};

function queryUrl(path, query = {}, options = {}) {
  const params = new URLSearchParams();
  if (Object.keys(query).length) params.set('filter', JSON.stringify(query));
  if (options.sort) params.set('sort', options.sort);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', String(options.cursor));
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

const entities = Object.fromEntries(Object.entries(resourcePaths).map(([name, path]) => [name, {
  filter: (query = {}, options = {}) => apiClient.get(queryUrl(`/api/${path}`, query, options)),
  list: (options = {}) => apiClient.get(queryUrl(`/api/${path}`, {}, options)),
  get: (id) => apiClient.get(`/api/${path}/${encodeURIComponent(id)}`),
  create: (data) => apiClient.post(`/api/${path}`, data),
  update: (id, data) => apiClient.patch(`/api/${path}/${encodeURIComponent(id)}`, data),
  delete: (id) => apiClient.del(`/api/${path}/${encodeURIComponent(id)}`),
  deleteMany: (query = {}) => apiClient.del(queryUrl(`/api/${path}`, query)),
  count: async (query = {}) => (await apiClient.get(queryUrl(`/api/${path}/count`, query))).count,
  aggregate: ({ query = {}, sum = [] } = {}) => {
    const params = new URLSearchParams();
    if (Object.keys(query).length) params.set('filter', JSON.stringify(query));
    if (sum.length) params.set('sum', sum.join(','));
    return apiClient.get(`/api/${path}/aggregate?${params.toString()}`);
  },
}]));

export const retailApi = {
  entities,
  auth: {
    me: async () => (await apiClient.get('/api/auth/me')).user,
    loginViaEmailPassword: async (email, password) => (await apiClient.post('/api/auth/login', { email, password })).user,
    register: async ({ full_name, email, password }) => (await apiClient.post('/api/auth/register', { full_name, email, password })).user,
    logout: () => apiClient.post('/api/auth/logout', {}),
  },
  functions: {
    invoke: async (name, payload) => {
      const paths = { processSale: '/api/sales/complete', adjustStock: '/api/stock-adjustments' };
      const path = paths[name];
      if (!path) throw new Error('That API operation is not available.');
      return { data: await apiClient.post(path, payload) };
    },
  },
};
