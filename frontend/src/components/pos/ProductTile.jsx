import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import StockBadge from '@/components/common/StockBadge';
import ProductImage from '@/components/products/ProductImage';

const CLAMP_STYLE = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export default function ProductTile({ product, currency, onAdd, threshold, inCart = 0 }) {
  const stock = Number(product.stock_quantity) || 0;
  const remaining = stock - inCart;
  const disabled = remaining <= 0;

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={disabled}
      className={cn(
        'group relative flex h-full flex-col rounded-xl border border-border bg-card p-3 text-left shadow-card transition-all duration-150',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted',
        disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:border-border hover:shadow-card',
      )}
    >
      {inCart > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground shadow-lifted">
          {inCart}
        </span>
      )}
      <ProductImage src={product.image_url} alt="" className="mb-3 h-24 w-full rounded-lg" />
      <p className="text-[13px] font-semibold leading-snug" style={CLAMP_STYLE}>{product.name}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">
        {product.brand ? `${product.brand} · ` : ''}{product.category || 'Uncategorised'}
        {product.sku ? ` · ${product.sku}` : ''}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <span className="tnum font-heading text-[15px] font-semibold">{formatCurrency(product.selling_price, currency)}</span>
        <StockBadge product={product} threshold={threshold} />
      </div>
      <span className="pointer-events-none absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <Plus className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}