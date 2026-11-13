import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Banknote, Check, ChevronRight, PackagePlus, PackageSearch, Receipt, Settings2, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import ErrorState from '@/components/common/ErrorState';
import SalesTrendChart from '@/components/dashboard/SalesTrendChart';
import RecentSalesPanel from '@/components/dashboard/RecentSalesPanel';
import TopProductsPanel from '@/components/dashboard/TopProductPanel';
import LowStockPanel from '@/components/dashboard/LowStockPanel';
import { useSettings } from '@/hooks/useSettings';
import { getDashboardSnapshot } from '@/services/dashboard';
import { formatCurrency, formatNumber } from '@/lib/format';

function CardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="surface p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-7 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';
  const threshold = Number(settings.low_stock_threshold) || 5;

  const dashboard = useQuery({
    queryKey: ['dashboard', threshold],
    queryFn: () => getDashboardSnapshot({ lowStockThreshold: threshold }),
  });

  const snapshot = dashboard.data;
  const storeProfileComplete = Boolean(settings.store_name?.trim());
  const productCatalogComplete = (snapshot?.activeProductCount ?? 0) > 0;
  const firstSaleComplete = (snapshot?.completedSaleCount ?? 0) > 0;
  const setupSteps = [
    { label: 'Add your store details', to: '/settings', complete: storeProfileComplete, icon: Settings2 },
    { label: 'Add your real products and opening stock', to: '/products', complete: productCatalogComplete, icon: PackagePlus },
    { label: 'Complete your first sale', to: '/pos', complete: firstSaleComplete, icon: ShoppingCart, disabled: !productCatalogComplete && !firstSaleComplete },
  ];
  const setupComplete = setupSteps.every((step) => step.complete);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Dashboard"
        description="Today's takings, the week's shape, and what needs restocking."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/reports">Open reports</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/pos">
                <ShoppingCart className="h-4 w-4" />
                Start a sale
              </Link>
            </Button>
          </>
        }
      />
{dashboard.isLoading ? (
        <div className="space-y-5">
          <CardsSkeleton />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="surface h-[340px] p-5 lg:col-span-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-6 h-[240px] w-full" />
            </div>
            <div className="surface h-[340px] p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-6 h-[240px] w-full" />
            </div>
          </div>
        </div>
      ) : dashboard.isError ? (
        <ErrorState
          title="The dashboard could not be calculated"
          error={dashboard.error}
          onRetry={() => dashboard.refetch()}
        />
      ) : (
        <div className="space-y-5">
          {!setupComplete && (
            <section className="surface overflow-hidden">
              <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] md:items-center md:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Your live store</p>
                  <h2 className="mt-2 font-heading text-lg font-semibold">Make it yours, one step at a time</h2>
                  <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                    This workspace starts empty on purpose. Add your own store details and catalogue—sales, stock and reports
                    will then reflect the records you enter.
                  </p>
                </div>
                <ol className="space-y-2">
                  {setupSteps.map((step, index) => {
                    const Icon = step.complete ? Check : step.icon;
                    const content = (
                      <>
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${step.complete ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-medium ${step.complete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {index + 1}. {step.label}
                          </span>
                          {step.disabled && <span className="mt-0.5 block text-xs text-muted-foreground">Add products before opening checkout.</span>}
                        </span>
                        {step.complete ? <Check className="h-4 w-4 text-success" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </>
                    );
                    return (
                      <li key={step.to}>
                        {step.disabled ? (
                          <div aria-disabled="true" className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 opacity-60">
                            {content}
                          </div>
                        ) : (
                          <Link to={step.to} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/40">
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today's sales"
              value={formatCurrency(snapshot.today.revenue, currency)}
              hint="Completed transactions recorded today"
              icon={Banknote}
              tone={snapshot.today.revenue > 0 ? 'positive' : 'default'}
            />
            <StatCard
              label="Transactions today"
              value={formatNumber(snapshot.today.transactions)}
              hint={snapshot.today.transactions === 0 ? 'No sale rung up yet today' : 'Receipts issued today'}
              icon={Receipt}
            />
            <StatCard
              label="Gross profit today"
              value={formatCurrency(snapshot.today.profit, currency)}
              hint="Selling price less cost price, before expenses"
              icon={TrendingUp}
            />
            <StatCard
              label="Low-stock products"
              value={formatNumber(snapshot.lowStock.length)}
              hint={`At or below the reorder level (${threshold})`}
              icon={PackageSearch}
              tone={snapshot.lowStock.length > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="surface p-5 lg:col-span-2">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-sm font-semibold">Sales over the last 7 days</h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {snapshot.hasData
                      ? `${snapshot.weekSalesCount} completed sales in this window`
                      : 'No sales recorded in the last 7 days'}
                  </p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  {currency}
                </span>
              </header>
              <div className="mt-4">
                <SalesTrendChart data={snapshot.series} currency={currency} />
              </div>
            </section>

            <LowStockPanel products={snapshot.lowStock} threshold={threshold} productCount={snapshot.activeProductCount} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <RecentSalesPanel sales={snapshot.recentSales} currency={currency} />
            <TopProductsPanel products={snapshot.topProducts} currency={currency} />
          </div>
        </div>
      )}
    </div>
  );
}
