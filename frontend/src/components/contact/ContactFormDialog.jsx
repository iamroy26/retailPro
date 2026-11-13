import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/common/FormField';

const COPY = {
  customer: { title: 'customer', description: 'Customers keep a purchase history and can be attached to a sale at checkout.' },
  supplier: { title: 'supplier', description: 'Suppliers are who you buy stock from — record deliveries in Inventory.' },
};

/** One record form for both customers and suppliers. */
export default function ContactFormDialog({ open, onOpenChange, record, kind = 'customer', onSubmit }) {
  const [values, setValues] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setValues({
      name: record?.name ?? '',
      contact_person: record?.contact_person ?? '',
      phone: record?.phone ?? '',
      email: record?.email ?? '',
      address: record?.address ?? '',
      notes: record?.notes ?? '',
    });
  }, [open, record]);

  const update = (field) => (event) => setValues((previous) => ({ ...previous, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a name.';
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'That email address does not look right.';
    }
    if (values.phone.trim() && values.phone.replace(/[^\d+]/g, '').length < 9) {
      nextErrors.phone = 'Enter a phone number with at least 9 digits.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        contact_person: kind === 'supplier' ? values.contact_person.trim() : '',
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        notes: values.notes.trim(),
      });
      setSaving(false);
      onOpenChange(false);
    } catch (error) {
      setSaving(false);
      setFormError(error?.message ?? 'That could not be saved.');
    }
  };

  const copy = COPY[kind] ?? COPY.customer;

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record ? `Edit ${copy.title}` : `Add a ${copy.title}`}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={kind === 'supplier' ? 'Business name' : 'Full name'} htmlFor="contact-name" error={errors.name} required className="sm:col-span-2">
              <Input id="contact-name" value={values.name} onChange={update('name')} autoFocus />
            </FormField>

            {kind === 'supplier' && (
              <FormField label="Contact person" htmlFor="contact-person">
                <Input id="contact-person" value={values.contact_person} onChange={update('contact_person')} />
              </FormField>
            )}

            <FormField label="Phone" htmlFor="contact-phone" error={errors.phone}>
              <Input id="contact-phone" value={values.phone} onChange={update('phone')} placeholder="024 000 0000" inputMode="tel" />
            </FormField>

            <FormField label="Email" htmlFor="contact-email" error={errors.email}>
              <Input id="contact-email" type="email" value={values.email} onChange={update('email')} placeholder="name@example.com" />
            </FormField>

            <FormField label="Address" htmlFor="contact-address" className="sm:col-span-2">
              <Input id="contact-address" value={values.address} onChange={update('address')} />
            </FormField>

            <FormField label="Notes (optional)" htmlFor="contact-notes" className="sm:col-span-2">
              <Textarea id="contact-notes" value={values.notes} onChange={update('notes')} rows={2} />
            </FormField>
          </div>

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
              {record ? 'Save changes' : `Add ${copy.title}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}