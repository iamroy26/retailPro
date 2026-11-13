import test from 'node:test';
import assert from 'node:assert/strict';
import { loginBody, reportQuery, saleBody, stockAdjustmentBody } from '../src/lib/requestSchemas.js';

test('login and registration schemas normalize identity fields and enforce password length', () => {
  assert.deepEqual(loginBody.parse({ email: '  OWNER@example.com ', password: 'secret' }), {
    email: 'owner@example.com',
    password: 'secret',
  });
  assert.equal(loginBody.safeParse({ email: 'not-an-email', password: 'secret' }).success, false);
});

test('sale schema accepts the current checkout payload and rejects invalid quantities', () => {
  const result = saleBody.safeParse({
    items: [{ product_id: 'product-id', quantity: '2' }],
    discount: '0',
    payment_method: 'cash',
    amount_received: '20',
    tax_rate: 0,
    total_hint: 20,
  });
  assert.equal(result.success, true);
  assert.equal(result.data.items[0].quantity, 2);
  assert.equal(saleBody.safeParse({ items: [{ product_id: 'p', quantity: 0 }] }).success, false);
});

test('inventory and report schemas reject invalid values and coerce query numbers', () => {
  assert.equal(stockAdjustmentBody.safeParse({
    product_id: 'product-id',
    mode: 'delta',
    quantity: -2,
    reason: 'Corrected count',
  }).success, true);
  assert.equal(stockAdjustmentBody.safeParse({
    product_id: 'product-id',
    quantity: 1,
    reason: 'x',
  }).success, false);
  assert.deepEqual(reportQuery.parse({ days: '30', low_stock_threshold: '4' }), {
    days: 30,
    low_stock_threshold: 4,
  });
});
