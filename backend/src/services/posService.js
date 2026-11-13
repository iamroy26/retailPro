import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../lib/errors.js';
import { finiteNumber, optionalText } from '../lib/validation.js';
import { calculateSaleAmounts } from './posMath.js';

const PAYMENT_METHODS = new Set(['cash', 'card', 'mobile_money']);

function receiptNumber() {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `RP-${timestamp}-${randomBytes(6).toString('hex').toUpperCase()}`;
}

export async function completeSale(ownerId, actor, body) {
  const rawLines = Array.isArray(body?.items) ? body.items : [];
  if (!rawLines.length || rawLines.length > 100) {
    throw new AppError('Add between 1 and 100 items before completing the sale.');
  }

  const merged = new Map();
  for (const line of rawLines) {
    const productId = String(line?.product_id ?? '').trim();
    const quantity = finiteNumber(line?.quantity, 'Each item quantity', { min: 1, integer: true });
    if (!productId) throw new AppError('Each sale item needs a product and a whole quantity above zero.');
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  const paymentMethod = String(body.payment_method ?? 'cash');
  if (!PAYMENT_METHODS.has(paymentMethod)) throw new AppError('Choose a valid payment method.');
  const customerName = optionalText(body.customer_name, 'Customer name', 160) || 'Walk-in customer';
  const notes = optionalText(body.notes, 'Sale notes', 1000);
  const productIds = [...merged.keys()].sort();

  return prisma.$transaction(async (tx) => {
    const settings = await tx.appSettings.findUnique({
      where: { owner_id: ownerId },
      select: { tax_rate: true },
    });
    const taxRate = Number(settings?.tax_rate) || 0;
    finiteNumber(taxRate, 'Tax rate', { min: 0, max: 100 });
    const lines = [];

    for (const productId of productIds) {
      const rows = await tx.$queryRaw`
        SELECT id, name, sku, unit, cost_price, selling_price, stock_quantity
        FROM products
        WHERE id = ${productId}::uuid
          AND owner_id = ${ownerId}::uuid
          AND is_archived = false
        FOR UPDATE
      `;
      const product = rows[0];
      if (!product) throw new AppError('A product in the cart is no longer available.');
      const quantity = merged.get(productId);
      const stockBefore = Number(product.stock_quantity);
      if (stockBefore < quantity) throw new AppError(`${product.name} only has ${stockBefore} in stock.`);
      const unitPrice = Number(product.selling_price);
      const unitCost = Number(product.cost_price);
      const lineTotal = Math.round((unitPrice * quantity + Number.EPSILON) * 100) / 100;
      lines.push({
        product_id: product.id,
        name: product.name,
        sku: product.sku ?? '',
        unit: product.unit,
        quantity,
        unit_price: unitPrice,
        cost_price: unitCost,
        line_total: lineTotal,
        stock_before: stockBefore,
        stock_after: stockBefore - quantity,
      });
    }

    const amounts = calculateSaleAmounts(lines, {
      discount: body.discount,
      taxRate,
      paymentMethod,
      amountReceived: body.amount_received,
    });

    let customerId = null;
    if (body.customer_id) {
      const customer = await tx.customer.findFirst({
        where: { id: String(body.customer_id), owner_id: ownerId },
        select: { id: true, name: true },
      });
      if (!customer) throw new AppError('The selected customer is not available.');
      customerId = customer.id;
    } else if (customerName !== 'Walk-in customer') {
      const matches = await tx.customer.findMany({
        where: { owner_id: ownerId, name: { equals: customerName, mode: 'insensitive' } },
        select: { id: true },
        take: 2,
      });
      if (matches.length === 1) customerId = matches[0].id;
    }

    const number = receiptNumber();
    const sale = await tx.sale.create({
      data: {
        owner_id: ownerId,
        receipt_number: number,
        item_count: amounts.itemCount,
        subtotal: amounts.subtotal,
        discount: amounts.discount,
        tax: amounts.tax,
        total: amounts.total,
        gross_profit: amounts.grossProfit,
        payment_method: paymentMethod,
        amount_received: amounts.received,
        change_due: amounts.changeDue,
        customer_id: customerId,
        customer_name: customerName,
        cashier_name: actor.full_name || actor.email,
        status: 'completed',
        notes,
        items: {
          create: lines.map(({ stock_before: _before, stock_after: _after, ...line }) => line),
        },
        payments: {
          create: {
            owner_id: ownerId,
            payment_method: paymentMethod,
            amount: amounts.total,
            reference: optionalText(body.payment_reference, 'Payment reference', 120),
            status: 'recorded',
          },
        },
      },
      include: { items: true, payments: true },
    });

    for (const line of lines) {
      await tx.product.update({
        where: { id: line.product_id },
        data: { stock_quantity: line.stock_after },
      });
      await tx.stockMovement.create({
        data: {
          owner_id: ownerId,
          product_id: line.product_id,
          product_name: line.name,
          sku: line.sku,
          type: 'sale',
          quantity_change: -line.quantity,
          quantity_before: line.stock_before,
          quantity_after: line.stock_after,
          reason: `Sale ${number}`,
          reference: number,
          recorded_by: actor.full_name || actor.email,
        },
      });
    }
    return { sale, receipt_number: number };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}
