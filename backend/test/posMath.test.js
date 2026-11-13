import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/lib/errors.js';
import { calculateSaleAmounts } from '../src/services/posMath.js';

const lines = [
  { quantity: 2, unit_price: 10, cost_price: 4, line_total: 20 },
];

test('calculates sale subtotal, tax, profit, and cash change', () => {
  assert.deepEqual(
    calculateSaleAmounts(lines, {
      discount: 2,
      taxRate: 10,
      paymentMethod: 'cash',
      amountReceived: 25,
    }),
    {
      subtotal: 20,
      discount: 2,
      tax: 1.8,
      total: 19.8,
      received: 25,
      changeDue: 5.2,
      itemCount: 2,
      grossProfit: 10,
    },
  );
});

test('records non-cash payments for exactly the amount due', () => {
  const amounts = calculateSaleAmounts(lines, {
    discount: 0,
    taxRate: 0,
    paymentMethod: 'card',
    amountReceived: 0,
  });
  assert.equal(amounts.received, 20);
  assert.equal(amounts.changeDue, 0);
});

test('rejects discounts above subtotal and insufficient cash', () => {
  assert.throws(
    () => calculateSaleAmounts(lines, { discount: 21, taxRate: 0, paymentMethod: 'cash', amountReceived: 25 }),
    AppError,
  );
  assert.throws(
    () => calculateSaleAmounts(lines, { discount: 0, taxRate: 0, paymentMethod: 'cash', amountReceived: 19 }),
    AppError,
  );
});

test('rejects invalid tax rates', () => {
  assert.throws(
    () => calculateSaleAmounts(lines, { discount: 0, taxRate: 101, paymentMethod: 'card' }),
    AppError,
  );
});
