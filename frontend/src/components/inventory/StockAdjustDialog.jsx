import { useEffect, useState } from 'react';
import { Loader2, PackageMinus, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/common/FormField';
import { MOVEMENT_TYPES } from '@/services/inventory';
import { cn } from '@/lib/utils';

const ADJUST_TYPES = ['purchase', 'adjustment', 'return', 'damage'];

export default function StockAdjustDialog({ open, onOpenChange, product, onSubmit }) {
  const [mode, setMode] = useState('delta');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('purchase');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode('delta');
    setQuantity('');
    setType('purchase');
    setReason('');
    setReference('');
    setError(null);
  }, [open]);

  if (!product) return null;

  const current = Number(product.stock_quantity) || 0;
  const entered = Number(quantity);
  const preview =
    quantity === '' || !Number.isFinite(entered) ? null : mode === 'delta' ? current + entered : entered;

  const submit = async (event) => {
    event.preventDefault();
    if (quantity === '' || !Number.isFinite(entered)) {
      setError('Enter a quantity.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Record why the stock is changing — every adjustment needs a reason.');
      return;
    }
    if (preview !== null && preview < 0) {
      setError(`That would take ${product.name} below zero.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        product_id: product.id,
        mode,
        quantity: entered,
        reason: reason.trim(),
        type,
        reference: reference.trim(),
      });
      setSaving(false);
      onOpenChange(false);
    } catch (submitError) {
      setSaving(false);
      setError(submitError?.message ?? 'The adjustment could not be saved.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {product.name} — currently {current} {product.unit || 'pcs'}. The new level and the reason are saved
            together as a history entry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('delta')}
              aria-pressed={mode === 'delta'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                mode === 'delta' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <PackagePlus className="h-4 w-4" />
              Receive / remove
            </button>
            <button
              type="button"
              onClick={() => setMode('set')}
              aria-pressed={mode === 'set'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                mode === 'set' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <PackageMinus className="h-4 w-4" />
              Set counted level
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={mode === 'delta' ? 'Quantity change' : 'Counted quantity'} htmlFor="adjust-quantity" hint={mode === 'delta' ? 'Use a minus sign to remove stock' : 'The quantity physically counted'}>
              <Input
                id="adjust-quantity"
                type="number"
                step="1"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder={mode === 'delta' ? 'e.g. 24 or -3' : 'e.g. 48'}
                autoFocus
              />
            </FormField>

            <FormField label="Movement type">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="adjust-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUST_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {MOVEMENT_TYPES[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Reason" htmlFor="adjust-reason" required hint="Printed in the stock history — for example “Delivery from Accra Wholesale”">
            <Textarea
              id="adjust-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="Why is the stock changing?"
            />
          </FormField>

          <FormField label="Reference (optional)" htmlFor="adjust-reference" hint="Invoice or delivery note number">
            <Input id="adjust-reference" value={reference} onChange={(event) => setReference(event.target.value)} />
          </FormField>

          {preview !== null && (
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm">
              <span className="text-muted-foreground">New stock level</span>
              <span className={cn('tnum font-semibold', preview < 0 && 'text-destructive')}>
                {current} → {preview}
              </span>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}