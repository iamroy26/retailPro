import { Link } from 'react-router-dom';
import { PackagePlus, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StockBadge from '@/components/common/StockBadge';
import EmptyState from '@/components/common/EmptyState';

export default function LowStockPanel({ products = [], threshold = 5, productCount = 0 }) {
  return (
    <section className="surface flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="font-heading text-sm font-semibold">Low stock alerts</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            At or below the store reorder level ({threshold})
          </p>
        </div>
        <Link to="/inventory" className="text-xs font-medium text-primary hover:underline">
          Adjust stock
        </Link>
      </header>
      {products.length === 0 ? (
        <div className="p-4">
          {productCount === 0 ? (
            <EmptyState
              icon={PackagePlus}
              title="Add products to track stock"
              description="Stock alerts will appear here once your real catalogue is in place."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/products">Add products</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="Everything is stocked"
              description="No product is at or below its reorder level right now."
            />
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.slice(0, 6).map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{product.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {product.sku || 'No SKU'} · reorder at {product.reorder_threshold ?? threshold}
                </p>
              </div>
              <StockBadge product={product} threshold={threshold} className="shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}