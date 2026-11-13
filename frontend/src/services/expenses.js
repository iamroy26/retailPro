import { retailApi } from '@/api/retailApi';

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Transport',
  'Wages',
  'Packaging',
  'Repairs',
  'Airtime & data',
  'Other',
];

function expenseQuery({ search = '', category = 'all', from = null, to = null }) {
  const query = {};
  if (category && category !== 'all') query.category = category;
  if (from || to) {
    query.expense_date = {};
    if (from) query.expense_date.$gte = from;
    if (to) query.expense_date.$lte = to;
  }
  const term = search.trim();
  if (term) query.title = { $regex: term, $options: 'i' };
  return query;
}

export async function listExpenses({ search = '', category = 'all', from = null, to = null, limit = 50, cursor = null } = {}) {
  const options = { sort: '-expense_date', limit };
  if (cursor) options.cursor = cursor;
  return retailApi.entities.Expense.filter(expenseQuery({ search, category, from, to }), options);
}

export async function createExpense(data) {
  return retailApi.entities.Expense.create(data);
}

export async function updateExpense(id, data) {
  return retailApi.entities.Expense.update(id, data);
}

export async function deleteExpense(id) {
  return retailApi.entities.Expense.delete(id);
}

export async function expensesTotals({ from = null, to = null } = {}) {
  const result = await retailApi.entities.Expense.aggregate({
    query: expenseQuery({ from, to }),
    sum: ['amount'],
  });
  const row = result?.rows?.[0] ?? {};
  return { total: row.sum_amount ?? 0, count: row.count ?? 0 };
}
