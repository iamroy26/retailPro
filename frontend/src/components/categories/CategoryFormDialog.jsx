import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import FormField from '@/components/common/FormField';
import { CATEGORY_COLORS } from '@/lib/category-colors';

const OPTIONS = Object.keys(CATEGORY_COLORS);

const EMPTY = { name: '', description: '', color: 'blue', is_active: true };

export default function CategoryFormDialog({ open, onOpenChange, category, onSubmit, onDelete }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(
      category
        ? {
            name: category.name ?? '',
            description: category.description ?? '',
            color: category.color ?? 'blue',
            is_active: category.is_active !== false,
          }
        : EMPTY,
    );
  }, [open, category]);

  const submit = async (event) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError('Enter a category name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
        color: values.color,
        is_active: values.is_active,
      });
      setSaving(false);
      onOpenChange(false);
    } catch (submitError) {
      setSaving(false);
      setError(submitError?.message ?? 'The category could not be saved.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'Add a category'}</DialogTitle>
          <DialogDescription>Categories group products in the catalogue and on the checkout screen.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <FormField label="Name" htmlFor="category-name" required>
            <Input
              id="category-name"
              value={values.name}
              onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="e.g. Beverages"
              autoFocus
            />
          </FormField>

          <FormField label="Description (optional)" htmlFor="category-description">
            <Input
              id="category-description"
              value={values.description}
              onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="What belongs in this category"
            />
          </FormField>

          <FormField label="Colour tag">
            <div className="flex flex-wrap gap-2">
              {OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setValues((previous) => ({ ...previous, color: option }))}
                  aria-pressed={values.color === option}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-transform ${CATEGORY_COLORS[option]} ${
                    values.color === option ? 'ring-2 ring-ring ring-offset-1' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </FormField>

          <div className="flex items-center justify-between rounded-lg border border-border px-3.5 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-[11px] text-muted-foreground">Inactive categories are hidden from the checkout filter</p>
            </div>
            <Switch
              checked={values.is_active}
              onCheckedChange={(checked) => setValues((previous) => ({ ...previous, is_active: checked }))}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {category && onDelete && (
                <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => onDelete(category)} disabled={saving}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {category ? 'Save changes' : 'Add category'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
