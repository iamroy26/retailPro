import { ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import CartLine from './CartLine';

export default function CartPanel({
  lines,
  totals,
  currency,
  discount,
  onDiscountChange,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCheckout,
  disabled = false,
  className = '',
}) {
  const empty = lines.length === 0;

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-heading text-sm font-semibold">Current sale</span>
          <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-muted-foreground" onClick={onClear} disabled={empty}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">The cart is empty</p>
          <p className="max-w-[220px] text-xs text-muted-foreground">
            Tap a product, search by name, or scan a barcode to start a sale.
          </p>
        </div>
      ) : (
        <ul className="thin-scroll min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {lines.map((line) => (
            <CartLine
              key={line.product_id}
              line={line}
              currency={currency}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      <div className="border-t border-border bg-muted/30 px-3.5 py-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <Label htmlFor="cart-discount" className="text-xs font-medium text-muted-foreground">
            Discount ({currency})
          </Label>
          <Input
            id="cart-discount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={discount}
            onChange={(event) => onDiscountChange(event.target.value)}
            className="h-8 w-24 text-right text-sm"
            disabled={empty}
          />
        </div>

        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tnum font-medium">{formatCurrency(totals.subtotal, currency)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="tnum font-medium text-success">− {formatCurrency(totals.discount, currency)}</dd>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tnum font-medium">{formatCurrency(totals.tax, currency)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-border pt-2">
            <dt className="font-heading text-sm font-semibold">Total</dt>
            <dd className="tnum font-heading text-xl font-semibold">{formatCurrency(totals.total, currency)}</dd>
          </div>
        </dl>

        <Button className="mt-3 h-11 w-full text-[15px] font-semibold" onClick={onCheckout} disabled={empty || disabled}>
          Take payment
        </Button>
      </div>
    </div>
  );
}
