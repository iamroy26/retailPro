import { retailApi } from '@/api/retailApi';
import { buildDailySalesSeries, computeTopProducts, roundMoney } from '@/lib/calculations';

function startOfTodayISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function startOfDaysAgoISO(days) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

/**
 * Dashboard figures are calculated on the server (count + aggregate); only the
 * seven-day series and the best-seller ranking need the underlying lines, so a
 * bounded page of the week's sales is loaded for those.
 */
export async function getDashboardSnapshot({ lowStockThreshold = 5, recentLimit = 6, days = 7 } = {}) {
  const threshold = Number(lowStockThreshold) || 5;
  const todayStart = startOfTodayISO();
  const weekStart = startOfDaysAgoISO(days - 1);

  const [todayAggregate, todayTransactions, weekPage, lowStockPage, activeProducts, completedSales] = await Promise.all([
    retailApi.entities.Sale.aggregate({
      query: { status: 'completed', sale_date: { $gte: todayStart } },
      sum: ['total', 'gross_profit'],
    }),
    retailApi.entities.Sale.count({ status: 'completed', sale_date: { $gte: todayStart } }),
    retailApi.entities.Sale.filter(
      { status: 'completed', sale_date: { $gte: weekStart } },
      { sort: '-sale_date', limit: 500 },
    ),
    retailApi.entities.Product.filter(
      { is_archived: false, stock_quantity: { $lte: threshold } },
      { sort: 'stock_quantity', limit: 40 },
    ),
    retailApi.entities.Product.count({ is_archived: false }),
    retailApi.entities.Sale.count({ status: 'completed' }),
  ]);

  const todayRow = todayAggregate?.rows?.[0] ?? {};
  const weekSales = weekPage.items ?? [];

  return {
    today: {
      revenue: roundMoney(todayRow.sum_total ?? 0),
      profit: roundMoney(todayRow.sum_gross_profit ?? 0),
      transactions: todayTransactions ?? 0,
    },
    hasData: weekSales.length > 0,
    series: buildDailySalesSeries(weekSales, days),
    recentSales: weekSales.slice(0, recentLimit),
    topProducts: computeTopProducts(weekSales, 5),
    lowStock: lowStockPage.items ?? [],
    weekSalesCount: weekSales.length,
    activeProductCount: activeProducts,
    completedSaleCount: completedSales,
  };
}