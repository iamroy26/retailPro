import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import EmptyState from '@/components/common/EmptyState';

export default function TopProductsPanel({ products = [], currency = 'GHS' }) {
  return (
    <section className="surface flex flex-col">
      <header className="border-b border-border px-4 py-3">
        <h2 className="font-heading text-sm font-semibold">Best sellers this week</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Ranked by units sold</p>
      </header>
      {products.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={TrendingUp}
            title="Nothing sold yet"
            description="Once sales are recorded, your fastest-moving products rank here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((product, index) => (
            <li key={product.product_id ?? product.name} className="flex items-center gap-3 px-4 py-3">
              <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{product.name}</p>
                <p className="tnum text-[11px] text-muted-foreground">{product.quantity} units sold</p>
              </div>
              <span className="tnum shrink-0 text-sm font-semibold">{formatCurrency(product.revenue, currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}