import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Boxes, Percent, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import SalesTrendChart from '@/components/dashboard/SalesTrendChart';
import { useSettings } from '@/hooks/useSettings';
import { getReportsData } from '@/services/reports';
import { expensesTotals } from '@/services/expenses';
import { resolveDateRange } from '@/services/sales';
import { formatCurrency, formatNumber } from '@/lib/format';

const RANGES = {
  '7d': { label: 'Last 7 days', days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  '365d': { label: 'Last 12 months', days: 365 },
};

function PeriodTable({ rows, emptyLabel }) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Period</TableHead>
          <TableHead className="text-right">Transactions</TableHead>
          <TableHead className="text-right">Units</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Gross profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="text-[13px] font-medium">{row.label}</TableCell>
            <TableCell className="tnum text-right text-[13px] text-muted-foreground">{row.transactions}</TableCell>
            <TableCell className="tnum text-right text-[13px] text-muted-foreground">{row.units}</TableCell>
            <TableCell className="tnum text-right text-[13px] font-medium">{formatCurrency(row.revenue)}</TableCell>
            <TableCell className="tnum text-right text-[13px] font-medium text-success">{formatCurrency(row.profit)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Reports() {
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';
  const threshold = Number(settings.low_stock_threshold) || 5;
  const [preset, setPreset] = useState('30d');

  const range = useMemo(() => resolveDateRange(preset), [preset]);
  const days = RANGES[preset]?.days ?? 30;

  const reportsQuery = useQuery({
    queryKey: ['reports', preset, threshold],
    queryFn: () => getReportsData({ from: range.from, to: range.to, lowStockThreshold: threshold, days }),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses-total', 'reports', preset],
    queryFn: () => expensesTotals({ from: range.from, to: range.to }),
  });

  const report = reportsQuery.data;
  const expenses = expensesQuery.data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Reports"
        description="How the shop is actually performing. Every figure below is calculated from records stored in the app â€” nothing is estimated."
        actions={
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="h-10 w-[190px]" aria-label="Reporting period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGES).map(([value, option]) => (
                <SelectItem key={value} value={value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
{reportsQuery.isLoading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="surface p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-4 h-7 w-28" />
              </div>
            ))}
          </div>
          <div className="surface h-[320px] p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-6 h-[220px] w-full" />
          </div>
        </div>
      ) : reportsQuery.isError ? (
        <ErrorState title="Reports could not be calculated" error={reportsQuery.error} onRetry={() => reportsQuery.refetch()} />
      ) : report.salesLoaded === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No sales in this period"
          description="Choose a wider period, or ring up some sales and the reports will build themselves."
        />
      ) : (
        <div className="space-y-5">
          {report.truncated && (
            <p className="rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-xs text-muted-foreground">
              This period holds more records than one report page can read, so the figures cover the most recent 1,000
              sales. Narrow the period for an exact total.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Revenue"
              value={formatCurrency(report.summary.revenue, currency)}
              hint={`${formatNumber(report.summary.transactions)} completed sales`}
              icon={Receipt}
              tone="positive"
            />
            <StatCard
              label="Gross profit"
              value={formatCurrency(report.summary.profit, currency)}
              hint="Selling price less cost price"
              icon={TrendingUp}
            />
            <StatCard
              label="Profit margin"
              value={`${report.profitMargin.toFixed(1)}%`}
              hint="Gross profit as a share of revenue"
              icon={Percent}
            />
            <StatCard
              label="Average basket"
              value={formatCurrency(report.summary.averageBasket, currency)}
              hint={`${formatNumber(report.summary.units)} units sold`}
            />
            <StatCard
              label="Recorded expenses"
              value={formatCurrency(expenses, currency)}
              hint={
                report.summary.profit - expenses >= 0
                  ? `${formatCurrency(report.summary.profit - expenses, currency)} left after expenses`
                  : 'Expenses recorded exceed gross profit in this period'
              }
              icon={Wallet}
            />
            <StatCard
              label="Stock value at cost"
              value={formatCurrency(report.valuation.costValue, currency)}
              hint={`Retail value ${formatCurrency(report.valuation.retailValue, currency)} across ${report.productCount} products`}
              icon={Boxes}
            />
          </div>

          <section className="surface p-5">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-sm font-semibold">Sales trend</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Daily revenue over the selected period
                </p>
              </div>
            </header>
            <div className="mt-4">
              <SalesTrendChart data={report.series} currency={currency} />
            </div>
          </section>

          <Tabs defaultValue="daily">
            <TabsList className="mb-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <div className="surface overflow-hidden">
                <PeriodTable rows={report.daily} emptyLabel="No daily sales in this period." />
              </div>
            </TabsContent>

            <TabsContent value="weekly">
              <div className="surface overflow-hidden">
                <PeriodTable rows={report.weekly} emptyLabel="No weekly sales in this period." />
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="surface overflow-hidden">
                <PeriodTable rows={report.monthly} emptyLabel="No monthly sales in this period." />
              </div>
            </TabsContent>

            <TabsContent value="products">
              <div className="surface overflow-hidden">
                {report.topProducts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">No product sales in this period.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Units sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topProducts.map((product) => (
                        <TableRow key={product.product_id ?? product.name}>
                          <TableCell>
                            <span className="text-[13px] font-medium">{product.name}</span>
                            <span className="block text-[11px] text-muted-foreground">{product.sku || 'No SKU'}</span>
                          </TableCell>
                          <TableCell className="tnum text-right text-[13px]">{product.quantity}</TableCell>
                          <TableCell className="tnum text-right text-[13px] font-medium">
                            {formatCurrency(product.revenue, currency)}
                          </TableCell>
                          <TableCell className="tnum text-right text-[13px] text-success">
                            {formatCurrency(product.profit, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Units on hand" value={formatNumber(report.valuation.units)} />
                  <StatCard label="Value at cost" value={formatCurrency(report.valuation.costValue, currency)} />
                  <StatCard label="Value at retail" value={formatCurrency(report.valuation.retailValue, currency)} />
                  <StatCard
                    label="Profit if all sold"
                    value={formatCurrency(report.valuation.potentialProfit, currency)}
                    tone="positive"
                  />
                </div>

                <div className="surface overflow-hidden">
                  <header className="border-b border-border px-4 py-3">
                    <h2 className="font-heading text-sm font-semibold">Low stock to reorder</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      At or below the store reorder level ({threshold})
                    </p>
                  </header>
                  {report.lowStock.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Every product is above its reorder level.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">In stock</TableHead>
                          <TableHead className="text-right">Reorder at</TableHead>
                          <TableHead className="text-right">Restock value at cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.lowStock.slice(0, 20).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="text-[13px] font-medium">{product.name}</TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">{product.category || 'â€”'}</TableCell>
                            <TableCell className="tnum text-right text-[13px] font-semibold text-warning">
                              {product.stock_quantity}
                            </TableCell>
                            <TableCell className="tnum text-right text-[13px] text-muted-foreground">
                              {product.reorder_threshold ?? threshold}
                            </TableCell>
                            <TableCell className="tnum text-right text-[13px] text-muted-foreground">
                              {formatCurrency(
                                Math.max(
                                  (Number(product.reorder_threshold) || threshold) * 2 -
                                    (Number(product.stock_quantity) || 0),
                                  0,
                                ) * (Number(product.cost_price) || 0),
                                currency,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Gross profit uses each product's cost price at the time of sale, so historical profit does not move when you
            re-price a product. Profit is shown before operating expenses.
          </p>
        </div>
      )}
    </div>
  );
}