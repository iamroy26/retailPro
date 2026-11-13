import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stockState } from '@/lib/calculations';

const STYLES = {
  ok: { label: 'In stock', className: 'border-success/25 bg-success-muted text-success', Icon: CheckCircle2 },
  low: { label: 'Low stock', className: 'border-warning/30 bg-warning-muted text-warning', Icon: AlertTriangle },
  out: { label: 'Out of stock', className: 'border-destructive/25 bg-destructive/10 text-destructive', Icon: XCircle },
};

export default function StockBadge({ product, threshold = 5, showQuantity = true, className }) {
  const state = stockState(product, threshold);
  const style = STYLES[state];
  const quantity = Number(product?.stock_quantity) || 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        style.className,
        className,
      )}
    >
      <style.Icon className="h-3 w-3" />
      {showQuantity ? `${quantity} ${product?.unit || 'pcs'}` : style.label}
    </span>
  );
}