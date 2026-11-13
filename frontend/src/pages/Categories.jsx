import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryFormDialog from '@/components/categories/CategoryFormDialog';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { createCategory, deleteCategory, listCategories, updateCategory } from '@/services/categories';
import { listActiveProducts } from '@/services/products';
import { formatCurrency } from '@/lib/format';
import { useSettings } from '@/hooks/useSettings';

const EMPTY_ITEMS = [];

export default function Categories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories({ includeInactive: true, limit: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'catalogue-summary'],
    queryFn: () => listActiveProducts(500),
  });

  const categories = categoriesQuery.data?.items ?? [];
  const products = productsQuery.data?.items ?? EMPTY_ITEMS;

  const statsByCategory = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      const key = product.category || 'Uncategorised';
      const entry = map.get(key) ?? { count: 0, stockValue: 0, units: 0 };
      entry.count += 1;
      entry.units += Number(product.stock_quantity) || 0;
      entry.stockValue += (Number(product.stock_quantity) || 0) * (Number(product.cost_price) || 0);
      map.set(key, entry);
    });
    return map;
  }, [products]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ category, values }) => (category ? updateCategory(category.id, values) : createCategory(values)),
    onSuccess: (_, variables) => {
      invalidate();
      toast({ title: variables.category ? 'Category updated' : 'Category added', description: `${variables.values.name} was saved.` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (category) => deleteCategory(category.id),
    onSuccess: (_, category) => {
      invalidate();
      toast({ title: 'Category deleted', description: `${category.name} was removed. Products keep their category label.` });
      setDeleteTarget(null);
      setEditing(null);
    },
  });

  const uncategorised = categories.length > 0 && statsByCategory.has('Uncategorised');

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Categories"
        description="Group the catalogue so checkout filters and reports make sense at a glance."
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        }
      />

      {categoriesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-6 h-4 w-full" />
            </div>
          ))}
        </div>
      ) : categoriesQuery.isError ? (
        <ErrorState title="Categories could not be loaded" error={categoriesQuery.error} onRetry={() => categoriesQuery.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Add categories such as Beverages, Provisions or Toiletries to organise the shop."
          action={
            <Button className="gap-2" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const stats = statsByCategory.get(category.name) ?? { count: 0, units: 0, stockValue: 0 };
            const colorClass = CATEGORY_COLORS[category.color] ?? CATEGORY_COLORS.slate;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setEditing(category)}
                className="surface p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-[15px] font-semibold">{category.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stats.count} product{stats.count === 1 ? '' : 's'} · {stats.units} in stock
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 border text-[11px] capitalize ${colorClass}`}>
                    {category.color}
                  </Badge>
                </div>
                {category.description && (
                  <p className="mt-3 line-clamp-none text-xs leading-relaxed text-muted-foreground">{category.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">Stock at cost</span>
                  <span className="tnum font-medium">{formatCurrency(stats.stockValue, currency)}</span>
                </div>
                {category.is_active === false && (
                  <p className="mt-3 text-[11px] font-medium text-warning">Hidden from checkout filters</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {uncategorised && (
        <p className="mt-5 text-xs text-muted-foreground">
          {statsByCategory.get('Uncategorised').count} product(s) carry no category — they appear as “Uncategorised”
          everywhere.
        </p>
      )}

      {(creating || editing) && (
        <CategoryFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          category={editing}
          onSubmit={(values) => saveMutation.mutateAsync({ category: editing, values })}
          onDelete={(category) => setDeleteTarget(category)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this category?"
        description={`${deleteTarget?.name} will be removed from the list. Products already labelled with it keep that label until you edit them.`}
        confirmLabel="Delete category"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
