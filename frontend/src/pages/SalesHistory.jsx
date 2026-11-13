import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Receipt, Search, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import TableSkeleton from '@/components/common/TableSkeleton';
import Pagination from '@/components/common/Pagination';
import PaymentMethodBadge from '@/components/common/PaymentMethodBadge';
import SaleDetailDialog from '@/components/sales/SaleDetailDialog';
import { useCursorPager } from '@/hooks/useCursorPager';
import { useSettings } from '@/hooks/useSettings';
import { DATE_RANGES, SALE_PAGE_SIZE, listSales, resolveDateRange, summariseSalesRange } from '@/services/sales';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';

const PAYMENT_FILTERS = [
  { value: 'all', label: 'All payment methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

export default function SalesHistory() {
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';
  const pager = useCursorPager();

  const [preset, setPreset] = useState('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [detail, setDetail] = useState(null);

  const range = useMemo(() => resolveDateRange(preset, { from, to }), [preset, from, to]);
  const filters = useMemo(
    () => ({ from: range.from, to: range.to, search, paymentMethod }),
    [range.from, range.to, search, paymentMethod],
  );

  const salesQuery = useQuery({
    queryKey: ['sales', filters, pager.cursor],
    queryFn: () => listSales({ ...filters, limit: SALE_PAGE_SIZE, cursor: pager.cursor }),
  });

  const summaryQuery = useQuery({
    queryKey: ['sales-summary', filters],
    queryFn: () => summariseSalesRange(filters),
  });

  const sales = salesQuery.data?.items ?? [];
  const summary = summaryQuery.data;

  const applyFilter = (setter) => (value) => {
    setter(value);
    pager.reset();
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Sales history"
        description="Every completed sale, newest first. Totals below are aggregated over the whole filter, not just this page."
      />

      <div className="surface mb-5 space-y-3 p-3.5">
        <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)_210px]">
          <Select value={preset} onValueChange={applyFilter(setPreset)}>
            <SelectTrigger className="h-10" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => applyFilter(setSearch)(event.target.value)}
              placeholder="Search receipt number, customer or cashier"
              className="h-10 pl-9 pr-9"
              aria-label="Search sales"
            />
            {search && (
              <button
                type="button"
                onClick={() => applyFilter(setSearch)('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={paymentMethod} onValueChange={applyFilter(setPaymentMethod)}>
            <SelectTrigger className="h-10" aria-label="Payment method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === 'custom' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <div>
              <label htmlFor="sales-from" className="field-label mb-1.5 block">
                From
              </label>
              <Input id="sales-from" type="date" value={from} onChange={(event) => applyFilter(setFrom)(event.target.value)} className="h-10" />
            </div>
            <div>
              <label htmlFor="sales-to" className="field-label mb-1.5 block">
                To
              </label>
              <Input id="sales-to" type="date" value={to} onChange={(event) => applyFilter(setTo)(event.target.value)} className="h-10" />
            </div>
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue in range"
          value={summary ? formatCurrency(summary.revenue, currency) : '—'}
          hint="Completed sales only"
          icon={Banknote}
          tone="positive"
        />
        <StatCard label="Transactions" value={summary ? formatNumber(summary.transactions) : '—'} icon={Receipt} />
        <StatCard
          label="Gross profit"
          value={summary ? formatCurrency(summary.profit, currency) : '—'}
          hint="Before expenses"
          icon={TrendingUp}
        />
        <StatCard
          label="Average basket"
          value={summary && summary.transactions > 0 ? formatCurrency(summary.revenue / summary.transactions, currency) : '—'}
          hint={summary && summary.transactions === 0 ? 'No sales in this range' : 'Revenue ÷ transactions'}
        />
      </div>

      {salesQuery.isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : salesQuery.isError ? (
        <ErrorState title="Sales could not be loaded" error={salesQuery.error} onRetry={() => salesQuery.refetch()} />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No sales in this range"
          description="Try a wider date range, clear the search, or ring up a sale on the checkout screen."
        />
      ) : (
        <div className="space-y-4">
          <div className="surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Receipt</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer"
                    onClick={() => setDetail(sale)}
                  >
                    <TableCell className="font-mono text-[12px]">{sale.receipt_number}</TableCell>
                    <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                      {formatDateTime(sale.sale_date)}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {sale.customer_name || 'Walk-in customer'}
                      <span className="block text-[11px] text-muted-foreground">Served by {sale.cashier_name || '—'}</span>
                    </TableCell>
                    <TableCell className="tnum text-right text-[13px]">{sale.item_count || 0}</TableCell>
                    <TableCell>
                      <PaymentMethodBadge method={sale.payment_method} />
                    </TableCell>
                    <TableCell className="tnum text-right text-[13px] font-semibold">
                      {formatCurrency(sale.total, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="surface">
            <Pagination
              page={pager.page}
              canGoPrev={pager.canGoPrev}
              canGoNext={Boolean(salesQuery.data?.has_more)}
              onPrev={pager.goPrev}
              onNext={() => pager.goNext(salesQuery.data?.next_cursor)}
              total={sales.length}
              totalLabel="sales"
            />
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Select a row to open the receipt and print it.
          </p>
        </div>
      )}

      <SaleDetailDialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
        sale={detail}
        settings={settings}
      />
    </div>
  );
}
