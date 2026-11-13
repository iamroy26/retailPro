import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/common/FormField';
import { EXPENSE_CATEGORIES } from '@/services/expenses';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank transfer' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseFormDialog({ open, onOpenChange, expense, currency, onSubmit }) {
  const [values, setValues] = useState({ title: '', category: 'Other', amount: '', payment_method: 'cash', expense_date: today(), notes: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setValues(
      expense
        ? {
            title: expense.title ?? '',
            category: expense.category ?? 'Other',
            amount: expense.amount ?? '',
            payment_method: expense.payment_method ?? 'cash',
            expense_date: expense.expense_date ?? today(),
            notes: expense.notes ?? '',
          }
        : { title: '', category: 'Other', amount: '', payment_method: 'cash', expense_date: today(), notes: '' },
    );
  }, [open, expense]);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.title.trim()) nextErrors.title = 'Describe the expense.';
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = 'Enter an amount above zero.';
    if (!values.expense_date) nextErrors.expense_date = 'Choose the date the money went out.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        category: values.category,
        amount,
        payment_method: values.payment_method,
        expense_date: values.expense_date,
        notes: values.notes.trim(),
      });
      setSaving(false);
      onOpenChange(false);
    } catch (error) {
      setSaving(false);
      setFormError(error?.message ?? 'The expense could not be saved.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Record an expense'}</DialogTitle>
          <DialogDescription>Money out of the business: rent, transport, wages, packaging.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <FormField label="What was it for" htmlFor="expense-title" error={errors.title} required>
            <Input id="expense-title" value={values.title} onChange={(event) => setValues((p) => ({ ...p, title: event.target.value }))} placeholder="e.g. Tro-tro fares for restocking" autoFocus />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={`Amount (${currency})`} htmlFor="expense-amount" error={errors.amount} required>
              <Input id="expense-amount" type="number" min="0" step="0.01" inputMode="decimal" value={values.amount} onChange={(event) => setValues((p) => ({ ...p, amount: event.target.value }))} placeholder="0.00" />
            </FormField>

            <FormField label="Category">
              <Select value={values.category} onValueChange={(value) => setValues((p) => ({ ...p, category: value }))}>
                <SelectTrigger id="expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Paid with">
              <Select value={values.payment_method} onValueChange={(value) => setValues((p) => ({ ...p, payment_method: value }))}>
                <SelectTrigger id="expense-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Date" htmlFor="expense-date" error={errors.expense_date} required>
              <Input id="expense-date" type="date" value={values.expense_date} onChange={(event) => setValues((p) => ({ ...p, expense_date: event.target.value }))} />
            </FormField>
          </div>

          <FormField label="Notes (optional)" htmlFor="expense-notes">
            <Textarea id="expense-notes" rows={2} value={values.notes} onChange={(event) => setValues((p) => ({ ...p, notes: event.target.value }))} />
          </FormField>

          {formError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? 'Save changes' : 'Record expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}