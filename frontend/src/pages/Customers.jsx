import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Pencil, Phone, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import TableSkeleton from '@/components/common/TableSkeleton';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ContactFormDialog from '@/components/contact/ContactFormDialog';
import { useCursorPager } from '@/hooks/useCursorPager';
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '@/services/customers';

const PAGE_SIZE = 20;

export default function Customers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pager = useCursorPager();

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const customersQuery = useQuery({
    queryKey: ['customers', search, pager.cursor],
    queryFn: () => listCustomers({ search, limit: PAGE_SIZE, cursor: pager.cursor }),
  });

  const customers = customersQuery.data?.items ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers'] });

  const saveMutation = useMutation({
    mutationFn: ({ record, values }) => (record ? updateCustomer(record.id, values) : createCustomer(values)),
    onSuccess: (_, variables) => {
      invalidate();
      toast({ title: variables.record ? 'Customer updated' : 'Customer added', description: `${variables.values.name} was saved.` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (record) => deleteCustomer(record.id),
    onSuccess: (_, record) => {
      invalidate();
      toast({ title: 'Customer deleted', description: `${record.name} was removed. Past sales keep their record.` });
      setDeleteTarget(null);
      setEditing(null);
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Customers"
        description="Keep regular buyers on file so their purchases stay together. Sales still work without a customer."
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      <div className="surface mb-5 p-3.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pager.reset();
            }}
            placeholder="Search by name, phone or email"
            className="h-10 pl-9 pr-9"
            aria-label="Search customers"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                pager.reset();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {customersQuery.isLoading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : customersQuery.isError ? (
        <ErrorState title="Customers could not be loaded" error={customersQuery.error} onRetry={() => customersQuery.refetch()} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No customer matches that search' : 'No customers on file yet'}
          description={
            search ? 'Try a different name or phone number.' : 'Add the buyers you want to track, or leave it — walk-in sales are fully supported.'
          }
          action={
            search ? null : (
              <Button className="gap-2" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="surface hidden overflow-hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="text-[13px] font-medium">{customer.name}</TableCell>
                    <TableCell className="tnum text-[13px] text-muted-foreground">{customer.phone || '—'}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{customer.email || '—'}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-[13px] text-muted-foreground">
                      {customer.address || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(customer)} aria-label={`Edit ${customer.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(customer)}
                          aria-label={`Delete ${customer.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-2 lg:hidden">
            {customers.map((customer) => (
              <li key={customer.id} className="surface p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold">{customer.name}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(customer)} aria-label={`Edit ${customer.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(customer)}
                      aria-label={`Delete ${customer.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {customer.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="surface">
            <Pagination
              page={pager.page}
              canGoPrev={pager.canGoPrev}
              canGoNext={Boolean(customersQuery.data?.has_more)}
              onPrev={pager.goPrev}
              onNext={() => pager.goNext(customersQuery.data?.next_cursor)}
              total={customers.length}
              totalLabel="customers"
            />
          </div>
        </div>
      )}

      {(creating || editing) && (
        <ContactFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          kind="customer"
          record={editing}
          onSubmit={(values) => saveMutation.mutateAsync({ record: editing, values })}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this customer?"
        description={`${deleteTarget?.name} will be removed from the customer list. Sales already recorded against them are not affected.`}
        confirmLabel="Delete customer"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
