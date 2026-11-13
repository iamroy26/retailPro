import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plug, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/common/PageHeader';
import ErrorState from '@/components/common/ErrorState';
import FormField from '@/components/common/FormField';
import ConnectionBadge from '@/components/common/ConnectionBadge';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { saveSettings } from '@/services/settings';
import { checkApiHealth, apiConfig } from '@/services/apiClient';

const FIELDS = [
  { key: 'store_name', label: 'Shop name', placeholder: 'e.g. Ama Provisions' },
  { key: 'store_tagline', label: 'Tagline', placeholder: 'e.g. Provisions & General Goods' },
  { key: 'store_address', label: 'Address', placeholder: 'Shop address printed on receipts' },
  { key: 'store_phone', label: 'Phone', placeholder: '024 000 0000' },
  { key: 'tin', label: 'TIN', placeholder: 'Tax identification number (optional)' },
  { key: 'currency', label: 'Currency code', placeholder: 'GHS' },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { settings, isLoading: settingsLoading, isError: settingsError, error, refetch } = useSettings();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(null);
  const health = useQuery({ queryKey: ['api-health'], queryFn: checkApiHealth, enabled: false });

  useEffect(() => {
    if (settingsLoading || settingsError || !settings || form) return;
    setForm({ ...settings });
  }, [settings, settingsLoading, settingsError, form]);

  const save = useMutation({
    mutationFn: () => saveSettings(settings, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const update = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  if (settingsError) {
    return (
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader title="Settings" description="Store details, tax rules, stock alerts and API status." />
        <ErrorState title="Store settings could not be loaded" error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!form) {
    return <div className="mx-auto w-full max-w-[1100px]"><PageHeader title="Settings" /><div className="surface flex items-center gap-3 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading store settings</div></div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <PageHeader title="Settings" description="Store details, tax rules, stock alerts and API status." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface p-5">
          <header className="mb-4 flex items-start justify-between gap-4">
            <div><h2 className="font-heading text-sm font-semibold">Store details</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Printed on receipts and used during checkout.</p></div>
            <ConnectionBadge compact />
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => <FormField key={field.key} label={field.label} htmlFor={`settings-${field.key}`}><Input id={`settings-${field.key}`} value={form[field.key] ?? ''} onChange={update(field.key)} placeholder={field.placeholder} disabled={!isAdmin} /></FormField>)}
            <FormField label="Tax / VAT rate (%)" htmlFor="settings-tax"><Input id="settings-tax" type="number" min="0" max="100" step="0.5" value={form.tax_rate ?? 0} onChange={update('tax_rate')} disabled={!isAdmin} /></FormField>
            <FormField label="Low stock alert level" htmlFor="settings-threshold"><Input id="settings-threshold" type="number" min="0" step="1" value={form.low_stock_threshold ?? 5} onChange={update('low_stock_threshold')} disabled={!isAdmin} /></FormField>
            <FormField label="Receipt footer" htmlFor="settings-footer" className="sm:col-span-2"><Textarea id="settings-footer" rows={2} value={form.receipt_footer ?? ''} onChange={update('receipt_footer')} disabled={!isAdmin} /></FormField>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button className="gap-2" onClick={() => save.mutate()} disabled={!isAdmin || save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save settings</Button>
            <Button variant="ghost" onClick={() => refetch()}>Reload</Button>
            {!isAdmin && <p className="flex items-center gap-2 text-xs text-warning"><ShieldAlert className="h-3.5 w-3.5" />Only an admin can change store settings.</p>}
            {save.isError && <p role="alert" className="text-xs text-destructive">{save.error.message}</p>}
            {save.isSuccess && <p className="text-xs text-success">Settings saved.</p>}
          </div>
        </section>

        <div className="space-y-5">
          <section className="surface p-5">
            <header className="mb-4"><h2 className="flex items-center gap-2 font-heading text-sm font-semibold"><Plug className="h-4 w-4 text-muted-foreground" />API and database</h2><p className="mt-1 text-xs text-muted-foreground">The app uses its Express API with Neon PostgreSQL.</p></header>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">API address</dt><dd className="break-all text-right font-mono text-xs">{apiConfig.baseUrl || 'Same-origin /api'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Database status</dt><dd className="text-right text-xs">{health.data?.message || 'Not checked yet'}</dd></div>
            </dl>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => health.refetch()} disabled={health.isFetching}><RefreshCw className="h-4 w-4" />{health.isFetching ? 'Checking…' : 'Check connection'}</Button>
          </section>

          <section className="surface p-5">
            <h2 className="mb-3 font-heading text-sm font-semibold">Signed in as</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Name</dt><dd className="truncate font-medium">{user?.full_name || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Email</dt><dd className="truncate font-medium">{user?.email || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Role</dt><dd className="font-medium capitalize">{user?.role || 'user'}</dd></div>
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Your records are scoped to your account in PostgreSQL.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
