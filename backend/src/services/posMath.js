import { AppError } from '../lib/errors.js';
import { finiteNumber } from '../lib/validation.js';

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function calculateSaleAmounts(lines, { discount, taxRate, paymentMethod, amountReceived }) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.line_total, 0));
  const discountAmount = finiteNumber(discount ?? 0, 'Discount', { min: 0 });
  if (discountAmount > subtotal) throw new AppError('Discount must be between zero and the sale subtotal.');
  const rate = finiteNumber(taxRate ?? 0, 'Tax rate', { min: 0, max: 100 });
  const tax = roundMoney((subtotal - discountAmount) * rate / 100);
  const total = roundMoney(subtotal - discountAmount + tax);
  const received = paymentMethod === 'cash'
    ? finiteNumber(amountReceived, 'Cash received', { min: total })
    : total;
  if (paymentMethod === 'cash' && received < total) {
    throw new AppError('Cash received is less than the total due.');
  }
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const grossProfit = roundMoney(
    lines.reduce((sum, line) => sum + (line.unit_price - line.cost_price) * line.quantity, 0) - discountAmount,
  );
  return {
    subtotal,
    discount: roundMoney(discountAmount),
    tax,
    total,
    received,
    changeDue: paymentMethod === 'cash' ? roundMoney(received - total) : 0,
    itemCount,
    grossProfit,
  };
}
