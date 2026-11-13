import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PAYMENT_METHODS, formatCurrency } from '@/lib/format';
import { changeDue } from '@/lib/calculations';

/**
 * Takes the payment, then hands the cart to the server. The sale is only
 * reported as recorded when the server returns the saved receipt.
 */
export default function PaymentDialog({ open, onOpenChange, lines, totals, currency, taxRate, onComplete }) {
  const [method, setMethod] = useState('cash');
  const [received, setReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod('cash');
      setReceived('');
      setCustomerName('');
      setNotes('');
      setError(null);
    }
  }, [open]);

  const receivedNumber = Number(received) || 0;
  const change = useMemo(() => changeDue(receivedNumber, totals.total), [receivedNumber, totals.total]);
  const shortfall = method === 'cash' && receivedNumber > 0 && receivedNumber < totals.total;

  const quickAmounts = useMemo(() => {
    const total = totals.total;
    const rounded = [Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100];
    return [...new Set([total, ...rounded.filter((value) => value >= total)])].slice(0, 4);
  }, [totals.total]);

  const submit = async () => {
    setError(null);
    if (method === 'cash' && receivedNumber < totals.total) {
      setError('Enter the cash received — it must cover the total due.');
      return;
    }
    setSaving(true);
    try {
      const result = await onComplete({
        items: lines.map((line) => ({ product_id: line.product_id, quantity: line.quantity })),
        discount: totals.discount,
        tax_rate: taxRate,
        payment_method: method,
        amount_received: method === 'cash' ? receivedNumber : totals.total,
        total_hint: totals.total,
        customer_name: customerName.trim(),
        notes: notes.trim(),
      });
      setSaving(false);
      return result;
    } catch (submitError) {
      setSaving(false);
      setError(submitError?.message ?? 'The sale could not be recorded. Nothing was saved.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} · the cart is priced again from stored
            product records before the sale is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total due</span>
            <span className="tnum font-heading text-2xl font-semibold">{formatCurrency(totals.total, currency)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment method</Label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMethod(option.value);
                  setError(null);
                }}
                aria-pressed={method === option.value}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                  method === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {PAYMENT_METHODS.find((option) => option.value === method)?.hint}
          </p>
        </div>

        {method === 'cash' && (
          <div className="space-y-2">
            <Label htmlFor="cash-received" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cash received ({currency})
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="cash-received"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={received}
                onChange={(event) => setReceived(event.target.value)}
                placeholder="0.00"
                className="h-10 w-32 text-right"
              />
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="tnum h-10"
                  onClick={() => setReceived(String(amount))}
                >
                  {formatCurrency(amount, currency)}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">Change due</span>
              <span className={cn('tnum text-sm font-semibold', shortfall ? 'text-destructive' : 'text-foreground')}>
                {formatCurrency(change, currency)}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sale-customer" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer (optional)
            </Label>
            <Input
              id="sale-customer"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Walk-in customer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale-notes" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Note (optional)
            </Label>
            <Textarea
              id="sale-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={1}
              className="min-h-[38px] resize-none"
              placeholder="Anything worth remembering"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Back to cart
          </Button>
          <Button onClick={submit} disabled={saving || shortfall || (method === 'cash' && receivedNumber <= 0)}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording sale
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete sale
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}