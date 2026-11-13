import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/format';
import PaymentMethodBadge from '@/components/common/PaymentMethodBadge';
import EmptyState from '@/components/common/EmptyState';

export default function RecentSalesPanel({ sales = [], currency = 'GHS' }) {
  return (
    <section className="surface flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-heading text-sm font-semibold">Recent transactions</h2>
        <Link to="/sales" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </header>
      {sales.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Completed sales will appear here as soon as the first one is rung up."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((sale) => (
            <li key={sale.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{sale.customer_name || 'Walk-in customer'}</p>
                <p className="tnum truncate text-[11px] text-muted-foreground">
                  {sale.receipt_number} · {formatTime(sale.sale_date)} · {sale.item_count || 0} items
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="tnum text-sm font-semibold">{formatCurrency(sale.total, currency)}</span>
                <PaymentMethodBadge method={sale.payment_method} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}