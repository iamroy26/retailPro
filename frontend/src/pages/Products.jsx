import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import TableSkeleton from '@/components/common/TableSkeleton';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ProductsTable from '@/components/products/ProductsTable';
import ProductFormDialog from '@/components/products/ProductFormDialog';
import ProductDetailDialog from '@/components/products/ProductDetailDialog';
import { useCursorPager } from '@/hooks/useCursorPager';
import { useSettings } from '@/hooks/useSettings';
import { listCategories } from '@/services/categories';
import {
  PRODUCT_PAGE_SIZE,
  PRODUCT_SORTS,
  STOCK_FILTERS,
  createProduct,
  deleteProduct,
  listProducts,
  setProductArchived,
  updateProduct,
} from '@/services/products';

export default function Products() {
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';
  const threshold = Number(settings.low_stock_threshold) || 5;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pager = useCursorPager();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sort, setSort] = useState('name_asc');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useMemo(
    () => ({ search, category, stockFilter, sort, includeArchived: showArchived, lowStockThreshold: threshold }),
    [search, category, stockFilter, sort, showArchived, threshold],
  );

  const productsQuery = useQuery({
    queryKey: ['products', filters, pager.cursor],
    queryFn: () => listProducts({ ...filters, cursor: pager.cursor, limit: PRODUCT_PAGE_SIZE }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories({ includeInactive: true, limit: 100 }),
  });

  const products = productsQuery.data?.items ?? [];
  const categories = categoriesQuery.data?.items ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ product, values }) => (product ? updateProduct(product.id, values) : createProduct(values)),
    onSuccess: (_, variables) => {
      invalidate();
      toast({
        title: variables.product ? 'Product updated' : 'Product added',
        description: `${variables.values.name} was saved.`,
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ product, archived }) => setProductArchived(product.id, archived),
    onSuccess: (_, variables) => {
      invalidate();
      toast({
        title: variables.archived ? 'Product archived' : 'Product restored',
        description: `${variables.product.name} ${variables.archived ? 'is hidden from the checkout screen' : 'can be sold again'}.`,
      });
      setArchiveTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (product) => deleteProduct(product.id),
    onSuccess: (_, product) => {
      invalidate();
      toast({ title: 'Product deleted', description: `${product.name} was removed from the catalogue.` });
      setDeleteTarget(null);
      setEditing(null);
    },
  });

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setStockFilter('all');
    setSort('name_asc');
    setShowArchived(false);
    pager.reset();
  };

  const filtersActive =
    search.trim() !== '' || category !== 'all' || stockFilter !== 'all' || sort !== 'name_asc' || showArchived;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Products"
        description="Your catalogue: prices, cost and stock levels. Archived products stay in past sales but cannot be sold."
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      <div className="surface mb-5 p-3.5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_180px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                pager.reset();
              }}
              placeholder="Search by name, SKU or barcode"
              className="h-10 pl-9 pr-9"
              aria-label="Search products"
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

          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              pager.reset();
            }}
          >
            <SelectTrigger className="h-10" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stockFilter}
            onValueChange={(value) => {
              setStockFilter(value);
              pager.reset();
            }}
          >
            <SelectTrigger className="h-10" aria-label="Filter by stock level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STOCK_FILTERS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value);
              pager.reset();
            }}
          >
            <SelectTrigger className="h-10" aria-label="Sort products">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_SORTS).map(([value, option]) => (
                <SelectItem key={value} value={value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <label className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
            <Switch
              checked={showArchived}
              onCheckedChange={(checked) => {
                setShowArchived(checked);
                pager.reset();
              }}
            />
            Include archived products
          </label>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {productsQuery.isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : productsQuery.isError ? (
        <ErrorState title="Products could not be loaded" error={productsQuery.error} onRetry={() => productsQuery.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filtersActive ? 'No products match these filters' : 'Your catalogue is empty'}
          description={
            filtersActive
              ? 'Try a different search term, category or stock filter.'
              : 'Add your first product with its SKU, prices and opening stock to start selling.'
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Button className="gap-2" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Add product
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <ProductsTable
            products={products}
            currency={currency}
            threshold={threshold}
            onView={setViewing}
            onEdit={setEditing}
            onArchive={(product) => setArchiveTarget({ product, archived: true })}
            onRestore={(product) => setArchiveTarget({ product, archived: false })}
          />
          <div className="surface">
            <Pagination
              page={pager.page}
              canGoPrev={pager.canGoPrev}
              canGoNext={Boolean(productsQuery.data?.has_more)}
              onPrev={pager.goPrev}
              onNext={() => pager.goNext(productsQuery.data?.next_cursor)}
              total={products.length}
              totalLabel="products"
            />
          </div>
        </div>
      )}

      {(creating || editing) && (
        <ProductFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          product={editing}
          categories={categories}
          onSubmit={(values) => saveMutation.mutateAsync({ product: editing, values })}
          onDelete={(product) => setDeleteTarget(product)}
        />
      )}

      <ProductDetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        product={viewing}
        currency={currency}
        threshold={threshold}
        onEdit={(product) => {
          setViewing(null);
          setEditing(product);
        }}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={archiveTarget?.archived ? 'Archive this product?' : 'Restore this product?'}
        description={
          archiveTarget?.archived
            ? `${archiveTarget?.product?.name} will be hidden from checkout and the product list. Past sales keep their record of it.`
            : `${archiveTarget?.product?.name} will be sellable again.`
        }
        confirmLabel={archiveTarget?.archived ? 'Archive product' : 'Restore product'}
        loading={archiveMutation.isPending}
        onConfirm={() => archiveTarget && archiveMutation.mutate(archiveTarget)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this product permanently?"
        description={`${deleteTarget?.name} will be removed from the catalogue. Use Archive instead if you may need the record later — deletion cannot be undone.`}
        confirmLabel="Delete product"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}