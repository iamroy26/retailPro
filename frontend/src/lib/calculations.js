import { format, subDays, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { DEFAULT_CURRENCY } from './format';

/**
 * All retail maths lives here, away from the presentation components, so the
 * same rules can be mirrored by the Express/Neon backend later.
 * Every helper is pure: give it records, get numbers back.
 */

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function isLowStock(product, threshold = 5) {
  if (!product) return false;
  const stock = Number(product.stock_quantity) || 0;
  const reorder = Number(product.reorder_threshold) || threshold;
  return stock <= reorder;
}

export function isOutOfStock(product) {
  return (Number(product?.stock_quantity) || 0) <= 0;
}

export function stockState(product, threshold = 5) {
  const stock = Number(product?.stock_quantity) || 0;
  if (stock <= 0) return 'out';
  if (isLowStock(product, threshold)) return 'low';
  return 'ok';
}

/** Cart maths: subtotal → discount → tax → total, with per-line totals. */
export function computeCartTotals(lines = [], { discount = 0, taxRate = 0 } = {}) {
  const priced = lines.map((line) => ({
    ...line,
    line_total: roundMoney((Number(line.unit_price) || 0) * (Number(line.quantity) || 0)),
  }));
  const subtotal = roundMoney(priced.reduce((sum, line) => sum + line.line_total, 0));
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const taxable = roundMoney(subtotal - discountValue);
  const tax = roundMoney(taxable * ((Number(taxRate) || 0) / 100));
  const total = roundMoney(taxable + tax);
  return {
    lines: priced,
    subtotal,
    discount: discountValue,
    tax,
    total,
    itemCount: priced.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
  };
}

export function computeLineProfit(lines = []) {
  return roundMoney(
    lines.reduce((sum, line) => {
      const quantity = Number(line.quantity) || 0;
      const unit = Number(line.unit_price) || 0;
      const cost = Number(line.cost_price) || 0;
      return sum + (unit - cost) * quantity;
    }, 0),
  );
}

export function buildReceiptNumber(date = new Date()) {
  const stamp = format(date, 'yyyyMMdd-HHmmss');
  const noise = Math.floor(Math.random() * 90 + 10);
  return `RP-${stamp}-${noise}`;
}

/** Summarise a set of sale records into the headline numbers a dashboard needs. */
export function summariseSales(sales = []) {
  const completed = sales.filter((sale) => (sale.status ?? 'completed') === 'completed');
  const revenue = roundMoney(completed.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0));
  const profit = roundMoney(
    completed.reduce((sum, sale) => {
      if (Number.isFinite(Number(sale.gross_profit))) return sum + Number(sale.gross_profit);
      return sum + computeLineProfit(sale.items ?? []);
    }, 0),
  );
  return {
    revenue,
    profit,
    transactions: completed.length,
    units: completed.reduce((sum, sale) => sum + (Number(sale.item_count) || 0), 0),
    averageBasket: completed.length ? roundMoney(revenue / completed.length) : 0,
  };
}

/** A day-by-day series of totals, always `days` long so the chart never gaps. */
export function buildDailySalesSeries(sales = [], days = 7) {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = subDays(today, index);
    buckets.push({ key: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE d'), date, total: 0, transactions: 0 });
  }
  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  sales.forEach((sale) => {
    if (!sale.sale_date || (sale.status ?? 'completed') !== 'completed') return;
    const key = format(new Date(sale.sale_date), 'yyyy-MM-dd');
    const bucket = index.get(key);
    if (!bucket) return;
    bucket.total = roundMoney(bucket.total + (Number(sale.total) || 0));
    bucket.transactions += 1;
  });
  return buckets;
}

/** Best sellers, ranked by units moved, from whatever sale records are loaded. */
export function computeTopProducts(sales = [], limit = 5) {
  const map = new Map();
  sales.forEach((sale) => {
    if ((sale.status ?? 'completed') !== 'completed') return;
    (sale.items ?? []).forEach((line) => {
      const key = line.product_id || line.name;
      if (!key) return;
      const entry = map.get(key) ?? {
        product_id: line.product_id,
        name: line.name ?? 'Unnamed item',
        sku: line.sku,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      const quantity = Number(line.quantity) || 0;
      entry.quantity += quantity;
      entry.revenue = roundMoney(entry.revenue + Number(line.line_total ?? quantity * (Number(line.unit_price) || 0)));
      entry.profit = roundMoney(entry.profit + (Number(line.unit_price) - Number(line.cost_price)) * quantity);
      map.set(key, entry);
    });
  });
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export function computeInventoryValuation(products = []) {
  return products.reduce(
    (totals, product) => {
      const stock = Number(product.stock_quantity) || 0;
      totals.units += stock;
      totals.costValue = roundMoney(totals.costValue + stock * (Number(product.cost_price) || 0));
      totals.retailValue = roundMoney(totals.retailValue + stock * (Number(product.selling_price) || 0));
      return totals;
    },
    { units: 0, costValue: 0, retailValue: 0, potentialProfit: 0 },
  );
}

export function inventoryTotals(products = []) {
  const totals = computeInventoryValuation(products);
  totals.potentialProfit = roundMoney(totals.retailValue - totals.costValue);
  return totals;
}

/** Groups sales for the daily / weekly / monthly report tables. */
export function groupSalesByPeriod(sales = [], period = 'day') {
  const starters = { day: startOfDay, week: startOfWeek, month: startOfMonth };
  const formats = { day: 'EEE d MMM', week: "'Week of' d MMM", month: 'MMMM yyyy' };
  const start = starters[period] ?? startOfDay;
  const map = new Map();
  sales.forEach((sale) => {
    if (!sale.sale_date || (sale.status ?? 'completed') !== 'completed') return;
    const key = format(start(new Date(sale.sale_date)), 'yyyy-MM-dd');
    const entry = map.get(key) ?? {
      key,
      label: format(start(new Date(sale.sale_date)), formats[period] ?? formats.day),
      revenue: 0,
      profit: 0,
      transactions: 0,
      units: 0,
    };
    entry.revenue = roundMoney(entry.revenue + (Number(sale.total) || 0));
    entry.profit = roundMoney(entry.profit + (Number(sale.gross_profit) || 0));
    entry.transactions += 1;
    entry.units += Number(sale.item_count) || 0;
    map.set(key, entry);
  });
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function changeDue(amountReceived, total) {
  const received = Number(amountReceived) || 0;
  return roundMoney(Math.max(received - (Number(total) || 0), 0));
}

export { DEFAULT_CURRENCY };