import { prisma } from '../db/prisma.js';
import { AppError } from '../lib/errors.js';
import { finiteNumber, parseDate } from '../lib/validation.js';

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function dailySeries(rows, days) {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today - (days - index - 1) * 86_400_000);
    return {
      key: dayKey(date),
      label: new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(date),
      date,
      total: 0,
      transactions: 0,
    };
  });
  const byDay = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const row of rows) {
    const bucket = byDay.get(dayKey(row.period));
    if (!bucket) continue;
    bucket.total = money(row.revenue);
    bucket.transactions = Number(row.transactions);
  }
  return buckets;
}

function periodRows(rows, period) {
  const formatter = new Intl.DateTimeFormat('en', period === 'month'
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : period === 'week'
      ? { day: 'numeric', month: 'short', timeZone: 'UTC' }
      : { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  return rows.map((row) => {
    const date = new Date(row.period);
    const label = period === 'week' ? `Week of ${formatter.format(date)}` : formatter.format(date);
    return {
      key: dayKey(date),
      label,
      transactions: Number(row.transactions),
      units: Number(row.units),
      revenue: money(row.revenue),
      profit: money(row.profit),
    };
  });
}

async function groupedSales(ownerId, from, to, period) {
  return prisma.$queryRaw`
    SELECT date_trunc(${period}, sale_date) AS period,
           count(*)::int AS transactions,
           COALESCE(sum(item_count), 0)::numeric AS units,
           COALESCE(sum(total), 0)::numeric AS revenue,
           COALESCE(sum(gross_profit), 0)::numeric AS profit
    FROM sales
    WHERE owner_id = ${ownerId}::uuid
      AND status = 'completed'
      AND sale_date >= ${from}
      AND sale_date <= ${to}
    GROUP BY 1
    ORDER BY 1 DESC
  `;
}

export async function getReport(ownerId, query) {
  const from = parseDate(query.from, 'Start date');
  const to = parseDate(query.to || new Date().toISOString(), 'End date');
  if (from > to) throw new AppError('Start date must be before end date.');
  const days = finiteNumber(query.days ?? 30, 'Report days', { min: 1, max: 366, integer: true });
  const threshold = finiteNumber(query.low_stock_threshold ?? 5, 'Low-stock threshold', { min: 0 });
  const where = { owner_id: ownerId, status: 'completed', sale_date: { gte: from, lte: to } };

  const [summary, totalSales, daily, weekly, monthly, topProducts, inventory, lowStock, productCount] = await Promise.all([
    prisma.sale.aggregate({
      where,
      _sum: { total: true, gross_profit: true, item_count: true },
    }),
    prisma.sale.count({ where }),
    groupedSales(ownerId, from, to, 'day'),
    groupedSales(ownerId, from, to, 'week'),
    groupedSales(ownerId, from, to, 'month'),
    prisma.$queryRaw`
      SELECT i.product_id, i.name, i.sku,
             COALESCE(sum(i.quantity), 0)::numeric AS quantity,
             COALESCE(sum(i.line_total), 0)::numeric AS revenue,
             COALESCE(sum((i.unit_price - i.cost_price) * i.quantity), 0)::numeric AS profit
      FROM sale_items i
      JOIN sales s ON s.id = i.sale_id
      WHERE s.owner_id = ${ownerId}::uuid
        AND s.status = 'completed'
        AND s.sale_date >= ${from}
        AND s.sale_date <= ${to}
      GROUP BY i.product_id, i.name, i.sku
      ORDER BY quantity DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT count(*)::int AS product_count,
             COALESCE(sum(stock_quantity), 0)::numeric AS units,
             COALESCE(sum(stock_quantity * cost_price), 0)::numeric AS cost_value,
             COALESCE(sum(stock_quantity * selling_price), 0)::numeric AS retail_value
      FROM products
      WHERE owner_id = ${ownerId}::uuid AND is_archived = false
    `,
    prisma.product.findMany({
      where: {
        owner_id: ownerId,
        is_archived: false,
        stock_quantity: { lte: threshold },
      },
      orderBy: { stock_quantity: 'asc' },
      take: 100,
    }),
    prisma.product.count({ where: { owner_id: ownerId, is_archived: false } }),
  ]);

  const revenue = money(summary._sum.total ?? 0);
  const profit = money(summary._sum.gross_profit ?? 0);
  const units = Number(summary._sum.item_count ?? 0);
  const transactions = totalSales;
  const costValue = money(inventory[0]?.cost_value ?? 0);
  const retailValue = money(inventory[0]?.retail_value ?? 0);

  return {
    truncated: false,
    salesLoaded: totalSales,
    summary: {
      revenue,
      profit,
      transactions,
      units,
      averageBasket: transactions ? money(revenue / transactions) : 0,
    },
    series: dailySeries(daily, days),
    daily: periodRows(daily, 'day').slice(0, 14),
    weekly: periodRows(weekly, 'week').slice(0, 12),
    monthly: periodRows(monthly, 'month').slice(0, 12),
    topProducts: topProducts.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      revenue: money(item.revenue),
      profit: money(item.profit),
    })),
    valuation: {
      units: Number(inventory[0]?.units ?? 0),
      costValue,
      retailValue,
      potentialProfit: money(retailValue - costValue),
    },
    lowStock,
    productCount,
    profitMargin: revenue > 0 ? money((profit / revenue) * 100) : 0,
  };
}
