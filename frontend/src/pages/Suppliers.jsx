import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2, Truck, X } from 'lucide-react';
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
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from '@/services/suppliers';
import { listMovements } from '@/services/inventory';
import { formatDateTime, formatQuantity } from '@/lib/format';

const PAGE_SIZE = 20;

export default function Suppliers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pager = useCursorPager();

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', search, pager.cursor],
    queryFn: () => listSuppliers({ search, limit: PAGE_SIZE, cursor: pager.cursor }),
  });

  const purchasesQuery = useQuery({
    queryKey: ['inventory', 'purchases'],
    queryFn: () => listMovements({ type: 'purchase', limit: 8 }),
  });

  const suppliers = suppliersQuery.data?.items ?? [];
  const purchases = purchasesQuery.data?.items ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] });

  const saveMutation = useMutation({
    mutationFn: ({ record, values }) => (record ? updateSupplier(record.id, values) : createSupplier(values)),
    onSuccess: (_, variables) => {
      invalidate();
      toast({ title: variables.record ? 'Supplier updated' : 'Supplier added', description: `${variables.values.name} was saved.` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (record) => deleteSupplier(record.id),
    onSuccess: (_, record) => {
      invalidate();
      toast({ title: 'Supplier deleted', description: `${record.name} was removed.` });
      setDeleteTarget(null);
      setEditing(null);
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Suppliers"
        description="Who you buy stock from. Deliveries you receive are recorded as stock movements in Inventory."
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add supplier
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <div className="surface mb-5 p-3.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  pager.reset();
                }}
                placeholder="Search suppliers by name, contact or phone"
                className="h-10 pl-9 pr-9"
                aria-label="Search suppliers"
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

          {suppliersQuery.isLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : suppliersQuery.isError ? (
            <ErrorState title="Suppliers could not be loaded" error={suppliersQuery.error} onRetry={() => suppliersQuery.refetch()} />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={search ? 'No supplier matches that search' : 'No suppliers yet'}
              description={
                search
                  ? 'Try a different name or phone number.'
                  : 'Add the wholesalers and distributors you buy from to keep their details in one place.'
              }
              action={
                search ? null : (
                  <Button className="gap-2" onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" />
                    Add supplier
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="surface overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Contact person</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <span className="text-[13px] font-medium">{supplier.name}</span>
                          {supplier.email && <span className="block text-[11px] text-muted-foreground">{supplier.email}</span>}
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{supplier.contact_person || '—'}</TableCell>
                        <TableCell className="tnum text-[13px] text-muted-foreground">{supplier.phone || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(supplier)} aria-label={`Edit ${supplier.name}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(supplier)}
                              aria-label={`Delete ${supplier.name}`}
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

              <div className="surface">
                <Pagination
                  page={pager.page}
                  canGoPrev={pager.canGoPrev}
                  canGoNext={Boolean(suppliersQuery.data?.has_more)}
                  onPrev={pager.goPrev}
                  onNext={() => pager.goNext(suppliersQuery.data?.next_cursor)}
                  total={suppliers.length}
                  totalLabel="suppliers"
                />
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="surface">
            <header className="border-b border-border px-4 py-3">
              <h2 className="font-heading text-sm font-semibold">Recent stock purchases</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Deliveries recorded as purchase movements</p>
            </header>
            {purchasesQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : purchases.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground">
                No deliveries recorded yet. Receive stock from the Inventory screen and each delivery is listed here with
                the quantity it added.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {purchases.map((movement) => (
                  <li key={movement.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13px] font-medium">{movement.product_name}</p>
                      <span className="tnum shrink-0 text-[13px] font-semibold text-success">
                        +{movement.quantity_change}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {formatQuantity(movement.quantity_after, null)} in stock · {formatDateTime(movement.created_date)}
                    </p>
                    {movement.reason && <p className="mt-0.5 text-[11px] text-muted-foreground">{movement.reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {(creating || editing) && (
        <ContactFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          kind="supplier"
          record={editing}
          onSubmit={(values) => saveMutation.mutateAsync({ record: editing, values })}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this supplier?"
        description={`${deleteTarget?.name} will be removed from the supplier list. Stock movements recorded against them stay in the history.`}
        confirmLabel="Delete supplier"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
