import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../lib/errors.js';
import {
  finiteNumber,
  optionalText,
  parseDate,
  parseFilter,
  parseLimit,
  parseOffset,
  requiredText,
  requireObject,
} from '../lib/validation.js';
import { validateProductImageFields } from './productImageService.js';

const resources = {
  products: {
    delegate: 'product',
    fields: ['name', 'brand', 'sku', 'barcode', 'category', 'unit', 'cost_price', 'selling_price', 'stock_quantity', 'reorder_threshold', 'description', 'image_url', 'image_metadata', 'is_archived'],
    sort: ['name', 'sku', 'selling_price', 'stock_quantity', 'created_date'],
    sums: ['cost_price', 'selling_price', 'stock_quantity'],
    dates: ['created_date'],
  },
  categories: {
    delegate: 'category',
    fields: ['name', 'description', 'color', 'is_active'],
    sort: ['name', 'created_date'],
    dates: ['created_date'],
  },
  customers: {
    delegate: 'customer',
    fields: ['name', 'contact_person', 'phone', 'email', 'address', 'notes'],
    sort: ['name', 'created_date'],
    dates: ['created_date'],
  },
  suppliers: {
    delegate: 'supplier',
    fields: ['name', 'contact_person', 'phone', 'email', 'address', 'notes'],
    sort: ['name', 'created_date'],
    dates: ['created_date'],
  },
  expenses: {
    delegate: 'expense',
    fields: ['title', 'category', 'amount', 'payment_method', 'expense_date', 'notes'],
    sort: ['expense_date', 'amount', 'created_date'],
    sums: ['amount'],
    dates: ['expense_date', 'created_date'],
  },
  sales: {
    delegate: 'sale',
    fields: ['receipt_number', 'sale_date', 'item_count', 'subtotal', 'discount', 'tax', 'total', 'gross_profit', 'payment_method', 'amount_received', 'change_due', 'customer_id', 'customer_name', 'cashier_name', 'status', 'notes'],
    sort: ['sale_date', 'total', 'receipt_number', 'created_date'],
    sums: ['item_count', 'subtotal', 'discount', 'tax', 'total', 'gross_profit', 'amount_received', 'change_due'],
    dates: ['sale_date', 'created_date'],
    include: { items: true, payments: true },
  },
  'stock-movements': {
    delegate: 'stockMovement',
    fields: ['product_id', 'supplier_id', 'product_name', 'sku', 'type', 'quantity_change', 'quantity_before', 'quantity_after', 'reason', 'reference', 'recorded_by'],
    sort: ['created_date', 'product_name', 'type'],
    dates: ['created_date'],
  },
  'app-settings': {
    delegate: 'appSettings',
    fields: ['store_name', 'store_tagline', 'store_address', 'store_phone', 'tin', 'currency', 'tax_rate', 'receipt_footer', 'low_stock_threshold'],
    sort: ['created_date', 'updated_date'],
    dates: ['created_date', 'updated_date'],
  },
};

function getResource(name) {
  const resource = resources[name];
  if (!resource) throw new AppError('Resource not found.', 404);
  return resource;
}

function convertValue(resource, field, value) {
  if (resource.dates.includes(field)) return parseDate(value, field);
  if ((field === 'category_id' || field === 'customer_id' || field === 'product_id' || field === 'supplier_id') && value === '') return null;
  return value;
}

function conditionFor(resource, field, expected) {
  if (!resource.fields.includes(field) || expected === null || expected === undefined || expected === '') return null;
  if (Array.isArray(expected)) {
    return { [field]: { in: expected.map((value) => convertValue(resource, field, value)) } };
  }
  if (typeof expected !== 'object') {
    return { [field]: convertValue(resource, field, expected) };
  }
  const condition = {};
  for (const [operator, raw] of Object.entries(expected)) {
    if (operator === '$options' || raw === undefined || raw === null || raw === '') continue;
    if (operator === '$regex') {
      condition.contains = String(raw).slice(0, 200);
      condition.mode = 'insensitive';
      continue;
    }
    if (operator === '$in' && Array.isArray(raw)) {
      condition.in = raw.map((value) => convertValue(resource, field, value));
      continue;
    }
    const prismaOperator = { $gte: 'gte', $lte: 'lte', $gt: 'gt', $lt: 'lt', $ne: 'not', $eq: 'equals' }[operator];
    if (prismaOperator) condition[prismaOperator] = convertValue(resource, field, raw);
  }
  return Object.keys(condition).length ? { [field]: condition } : null;
}

function whereFor(name, resource, filter, ownerId) {
  const clauses = [{ owner_id: ownerId }];
  for (const [field, expected] of Object.entries(filter)) {
    if (field === '$or' && Array.isArray(expected)) {
      const groups = expected.map((group) => {
        if (!group || typeof group !== 'object' || Array.isArray(group)) return {};
        const conditions = Object.entries(group)
          .map(([key, value]) => conditionFor(resource, key, value))
          .filter(Boolean);
        return conditions.length ? { AND: conditions } : {};
      }).filter((group) => Object.keys(group).length);
      if (groups.length) clauses.push({ OR: groups });
      continue;
    }
    const condition = conditionFor(resource, field, expected);
    if (condition) clauses.push(condition);
  }

  if (name === 'app-settings') return { owner_id: ownerId };
  return clauses.length === 1 ? clauses[0] : { AND: clauses };
}

function editableData(resource, body) {
  return Object.fromEntries(Object.entries(body ?? {}).filter(([field]) => resource.fields.includes(field)));
}

function normalizeDates(resource, data) {
  for (const field of resource.dates) {
    if (data[field] !== undefined) data[field] = parseDate(data[field], field);
  }
  return data;
}

async function categoryIdFor(tx, ownerId, categoryName) {
  const name = String(categoryName ?? '').trim();
  if (!name) return null;
  const category = await tx.category.findUnique({
    where: { owner_id_name: { owner_id: ownerId, name } },
    select: { id: true },
  });
  return category?.id ?? null;
}

function includeFor(resource) {
  return resource.include;
}

export async function list(name, ownerId, query) {
  const resource = getResource(name);
  const filter = parseFilter(query.filter);
  const where = whereFor(name, resource, filter, ownerId);
  let sort = String(query.sort ?? 'created_date');
  const descending = sort.startsWith('-');
  if (descending) sort = sort.slice(1);
  if (!resource.sort.includes(sort)) sort = resource.sort[0];
  const limit = parseLimit(query.limit);
  const offset = parseOffset(query.cursor);
  const delegate = prisma[resource.delegate];
  const [records, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: { [sort]: descending ? 'desc' : 'asc' },
      skip: offset,
      take: limit + 1,
      ...(includeFor(resource) ? { include: includeFor(resource) } : {}),
    }),
    delegate.count({ where }),
  ]);
  const hasMore = records.length > limit;
  if (hasMore) records.pop();
  return {
    items: records,
    has_more: hasMore,
    next_cursor: hasMore ? String(offset + limit) : null,
    ...(name === 'sales' ? { total } : {}),
  };
}

export async function count(name, ownerId, query) {
  const resource = getResource(name);
  return prisma[resource.delegate].count({
    where: whereFor(name, resource, parseFilter(query.filter), ownerId),
  });
}

export async function aggregate(name, ownerId, query) {
  const resource = getResource(name);
  const fields = String(query.sum ?? '').split(',').filter((field) => resource.sums?.includes(field));
  const result = await prisma[resource.delegate].aggregate({
    where: whereFor(name, resource, parseFilter(query.filter), ownerId),
    _count: { _all: true },
    ...(fields.length ? { _sum: Object.fromEntries(fields.map((field) => [field, true])) } : {}),
  });
  const row = { count: result._count._all };
  for (const field of fields) row[`sum_${field}`] = result._sum[field] ?? 0;
  return { rows: [row] };
}

export async function get(name, ownerId, id) {
  const resource = getResource(name);
  const record = await prisma[resource.delegate].findFirst({
    where: { id, owner_id: ownerId },
    ...(includeFor(resource) ? { include: includeFor(resource) } : {}),
  });
  if (!record) throw new AppError('Record not found.', 404);
  return record;
}

function validateData(name, data, creating = false, ownerId) {
  if (name === 'products') {
    if (creating || data.name !== undefined) data.name = requiredText(data.name, 'Product name', { max: 180 });
    if (creating || data.selling_price !== undefined) {
      data.selling_price = finiteNumber(data.selling_price, 'Selling price', { min: 0 });
      if (data.selling_price <= 0) throw new AppError('Selling price must be above zero.');
    }
    for (const field of ['cost_price', 'stock_quantity', 'reorder_threshold']) {
      if (data[field] !== undefined) data[field] = finiteNumber(data[field], field.replaceAll('_', ' '), { min: 0 });
    }
    for (const field of ['brand', 'sku', 'barcode', 'category', 'unit', 'description', 'image_url']) {
      if (data[field] !== undefined) data[field] = optionalText(data[field], field.replaceAll('_', ' '), field === 'brand' ? 120 : 2000);
    }
    validateProductImageFields(ownerId, data);
    if (data.is_archived !== undefined && typeof data.is_archived !== 'boolean') {
      throw new AppError('is_archived must be true or false.');
    }
  }
  if (name === 'expenses') {
    if (creating || data.title !== undefined) data.title = requiredText(data.title, 'Expense title', { max: 180 });
    if (creating || data.amount !== undefined) {
      data.amount = finiteNumber(data.amount, 'Expense amount', { min: 0 });
      if (data.amount <= 0) throw new AppError('Expense amount must be above zero.');
    }
    if (data.payment_method !== undefined && !['cash', 'card', 'mobile_money', 'bank'].includes(data.payment_method)) {
      throw new AppError('Choose a valid expense payment method.');
    }
    if (data.notes !== undefined) data.notes = optionalText(data.notes, 'Expense notes', 2000);
  }
  if (name === 'categories') {
    if (creating || data.name !== undefined) data.name = requiredText(data.name, 'Category name', { max: 120 });
    if (data.description !== undefined) data.description = optionalText(data.description, 'Category description', 1000);
    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      throw new AppError('is_active must be true or false.');
    }
  }
  if (['customers', 'suppliers'].includes(name)) {
    if (creating || data.name !== undefined) data.name = requiredText(data.name, 'Name', { max: 180 });
    if (data.email !== undefined && data.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new AppError('Enter a valid email address.');
    }
  }
  if (name === 'app-settings') {
    if (data.tax_rate !== undefined) data.tax_rate = finiteNumber(data.tax_rate, 'Tax rate', { min: 0, max: 100 });
    if (data.low_stock_threshold !== undefined) {
      data.low_stock_threshold = finiteNumber(data.low_stock_threshold, 'Low-stock threshold', { min: 0 });
    }
    if (data.currency !== undefined) {
      data.currency = requiredText(data.currency, 'Currency code', { min: 3, max: 3 }).toUpperCase();
      if (!/^[A-Z]{3}$/.test(data.currency)) throw new AppError('Currency code must contain three letters.');
    }
  }
}

async function createProduct(tx, ownerId, data) {
  const categoryId = await categoryIdFor(tx, ownerId, data.category);
  const sku = String(data.sku ?? '').trim() || null;
  const product = await tx.product.create({
    data: { ...data, sku, category_id: categoryId, owner_id: ownerId },
  });
  const opening = Number(product.stock_quantity);
  if (opening > 0) {
    await tx.stockMovement.create({
      data: {
        owner_id: ownerId,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku ?? '',
        type: 'adjustment',
        quantity_change: opening,
        quantity_before: 0,
        quantity_after: opening,
        reason: 'Opening stock',
        recorded_by: 'System',
      },
    });
  }
  return product;
}

export async function create(name, ownerId, body) {
  const resource = getResource(name);
  if (['sales', 'stock-movements'].includes(name)) {
    throw new AppError('Use the transaction endpoint for this resource.', 405);
  }
  const data = normalizeDates(resource, editableData(resource, requireObject(body)));
  validateData(name, data, true, ownerId);

  if (name === 'products') {
    if (data.image_metadata === null) delete data.image_metadata;
    return prisma.$transaction((tx) => createProduct(tx, ownerId, data));
  }
  if (name === 'app-settings') {
    return prisma.appSettings.upsert({
      where: { owner_id: ownerId },
      update: data,
      create: { ...data, owner_id: ownerId },
    });
  }
  return prisma[resource.delegate].create({ data: { ...data, owner_id: ownerId } });
}

export async function update(name, ownerId, id, body) {
  const resource = getResource(name);
  if (name === 'sales') throw new AppError('Sales are immutable; use a sale transaction endpoint.', 405);
  const data = normalizeDates(resource, editableData(resource, requireObject(body)));
  if (!Object.keys(data).length) throw new AppError('No editable fields were provided.');
  validateData(name, data, false, ownerId);

  if (name !== 'products') {
    const result = await prisma[resource.delegate].updateMany({
      where: { id, owner_id: ownerId },
      data,
    });
    if (!result.count) throw new AppError('Record not found.', 404);
    return get(name, ownerId, id);
  }

  if (data.image_metadata === null) data.image_metadata = Prisma.DbNull;
  return prisma.$transaction(async (tx) => {
    const records = await tx.$queryRaw`
      SELECT * FROM products
      WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid
      FOR UPDATE
    `;
    const current = records[0];
    if (!current) throw new AppError('Record not found.', 404);
    if (data.category !== undefined) data.category_id = await categoryIdFor(tx, ownerId, data.category);
    if (data.sku !== undefined) data.sku = String(data.sku).trim() || null;
    if (data.stock_quantity !== undefined && Number(data.stock_quantity) !== Number(current.stock_quantity)) {
      const before = Number(current.stock_quantity);
      const after = Number(data.stock_quantity);
      if (!Number.isFinite(after) || after < 0) throw new AppError('Stock cannot be negative.');
      await tx.stockMovement.create({
        data: {
          owner_id: ownerId,
          product_id: current.id,
          product_name: data.name ?? current.name,
          sku: data.sku ?? current.sku ?? '',
          type: 'adjustment',
          quantity_change: after - before,
          quantity_before: before,
          quantity_after: after,
          reason: 'Stock changed while editing product',
          recorded_by: 'System',
        },
      });
    }
    return tx.product.update({ where: { id }, data });
  });
}

export async function remove(name, ownerId, id) {
  const resource = getResource(name);
  if (name === 'sales') throw new AppError('Sales are immutable; use a return or refund transaction.', 405);
  const result = await prisma[resource.delegate].deleteMany({ where: { id, owner_id: ownerId } });
  if (!result.count) throw new AppError('Record not found.', 404);
  return { deleted: true, id };
}

export async function removeMany(name, ownerId, query) {
  const resource = getResource(name);
  if (name === 'sales') throw new AppError('Sales are immutable; use a return or refund transaction.', 405);
  const result = await prisma[resource.delegate].deleteMany({
    where: whereFor(name, resource, parseFilter(query.filter), ownerId),
  });
  return { deleted: result.count };
}

export async function supplierPurchases(ownerId, supplierId, name, limit) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, owner_id: ownerId },
    select: { id: true, name: true },
  });
  if (!supplier) throw new AppError('Supplier not found.', 404);
  return prisma.stockMovement.findMany({
    where: {
      owner_id: ownerId,
      type: 'purchase',
      OR: [
        { supplier_id: supplier.id },
        { reason: { contains: name || supplier.name, mode: 'insensitive' } },
      ],
    },
    orderBy: { created_date: 'desc' },
    take: parseLimit(limit, 20, 100),
  }).then((items) => ({ items, has_more: false, next_cursor: null }));
}
