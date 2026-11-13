import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, ClipboardList, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import TableSkeleton from '@/components/common/TableSkeleton';
import Pagination from '@/components/common/Pagination';
import StockBadge from '@/components/common/StockBadge';
import StockAdjustDialog from '@/components/inventory/StockAdjustDialog';
import { useCursorPager } from '@/hooks/useCursorPager';
import { useSettings } from '@/hooks/useSettings';
import { listProducts } from '@/services/products';
import { MOVEMENT_TYPES, MOVEMENT_PAGE_SIZE, adjustStock, listMovements } from '@/services/inventory';
import { formatDateTime, formatQuantity } from '@/lib/format';
import ProductImage from '@/components/products/ProductImage';

const EMPTY_ITEMS = [];

export default function Inventory() {
  const { settings } = useSettings();
  const threshold = Number(settings.low_stock_threshold) || 5;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pager = useCursorPager();

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [movementType, setMovementType] = useState('all');
  const [adjustTarget, setAdjustTarget] = useState(null);

  const productsQuery = useQuery({
    queryKey: ['inventory-products', search, lowStockOnly, threshold],
    queryFn: () =>
      listProducts({
        search,
        stockFilter: lowStockOnly ? 'low' : 'all',
        sort: 'stock_asc',
        lowStockThreshold: threshold,
        limit: 60,
      }),
  });

  const movementsQuery = useQuery({
    queryKey: ['inventory', movementType, pager.cursor],
    queryFn: () => listMovements({ type: movementType, limit: MOVEMENT_PAGE_SIZE, cursor: pager.cursor }),
  });

  const products = productsQuery.data?.items ?? EMPTY_ITEMS;
  const movements = movementsQuery.data?.items ?? [];

  const totals = useMemo(
    () =>
      products.reduce(
        (accumulator, product) => {
          accumulator.units += Number(product.stock_quantity) || 0;
          accumulator.costValue += (Number(product.stock_quantity) || 0) * (Number(product.cost_price) || 0);
          return accumulator;
        },
        { units: 0, costValue: 0 },
      ),
    [products],
  );

  const adjustMutation = useMutation({
    mutationFn: (payload) => adjustStock(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Stock updated',
        description: `${result?.product?.name ?? 'Product'} is now ${result?.movement?.quantity_after ?? '—'} in stock, with the reason recorded.`,
      });
      setAdjustTarget(null);
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Inventory"
        description="Stock levels and every adjustment made to them. Nothing changes silently — each movement carries a reason. Use Adjust on a row to receive a delivery or correct a count."
      />

      <Tabs defaultValue="levels" onValueChange={(value) => value === 'history' && pager.reset()}>
        <TabsList className="mb-5">
          <TabsTrigger value="levels" className="gap-2">
            <Boxes className="h-4 w-4" />
            Stock levels
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Adjustment history
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels">
          <div className="surface mb-5 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a product to adjust"
                className="h-10 pl-9 pr-9"
                aria-label="Search stock"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant={lowStockOnly ? 'default' : 'outline'}
              onClick={() => setLowStockOnly((previous) => !previous)}
              className="h-10 shrink-0"
            >
              {lowStockOnly ? 'Showing low stock only' : 'Show low stock only'}
            </Button>
          </div>

          {productsQuery.isLoading ? (
            <TableSkeleton rows={7} columns={5} />
          ) : productsQuery.isError ? (
            <ErrorState title="Stock levels could not be loaded" error={productsQuery.error} onRetry={() => productsQuery.refetch()} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title={lowStockOnly ? 'Nothing is low on stock' : 'No products to count'}
              description={
                lowStockOnly
                  ? 'Every product is above its reorder level right now.'
                  : 'Add products in the catalogue and their stock levels will be managed here.'
              }
            />
          ) : (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="surface p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Products shown</p>
                  <p className="tnum mt-2 font-heading text-xl font-semibold">{products.length}</p>
                </div>
                <div className="surface p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Units on hand</p>
                  <p className="tnum mt-2 font-heading text-xl font-semibold">{totals.units}</p>
                </div>
                <div className="surface p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Stock at cost</p>
                  <p className="tnum mt-2 font-heading text-xl font-semibold">
                    {(settings.currency || 'GHS')} {totals.costValue.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="surface overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Reorder at</TableHead>
                      <TableHead className="text-right">Adjust</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <span className="flex items-center gap-3">
                            <ProductImage src={product.image_url} alt="" className="h-10 w-10" />
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium">{product.name}</span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {[product.brand, product.sku || 'No SKU'].filter(Boolean).join(' · ')}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{product.category || '—'}</TableCell>
                        <TableCell>
                          <StockBadge product={product} threshold={threshold} />
                        </TableCell>
                        <TableCell className="tnum text-right text-[13px] text-muted-foreground">
                          {formatQuantity(product.reorder_threshold ?? threshold, product.unit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setAdjustTarget({ product, defaultType: 'adjustment' })}>
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="surface mb-5 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Every entry below was written together with the stock change it describes.
            </p>
            <Select
              value={movementType}
              onValueChange={(value) => {
                setMovementType(value);
                pager.reset();
              }}
            >
              <SelectTrigger className="h-10 sm:w-[210px]" aria-label="Filter movements by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All movement types</SelectItem>
                {Object.entries(MOVEMENT_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {movementsQuery.isLoading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : movementsQuery.isError ? (
            <ErrorState title="Movement history could not be loaded" error={movementsQuery.error} onRetry={() => movementsQuery.refetch()} />
          ) : movements.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No stock movements yet"
              description="Deliveries you receive, sales you ring up and corrections you make all appear here."
            />
          ) : (
            <div className="surface overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>When</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Level</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                        {formatDateTime(movement.created_date)}
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] font-medium">{movement.product_name}</span>
                        <span className="block text-[11px] text-muted-foreground">{movement.sku || 'No SKU'}</span>
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {MOVEMENT_TYPES[movement.type] ?? movement.type}
                      </TableCell>
                      <TableCell
                        className={`tnum text-right text-[13px] font-semibold ${
                          Number(movement.quantity_change) < 0 ? 'text-destructive' : 'text-success'
                        }`}
                      >
                        {Number(movement.quantity_change) > 0 ? '+' : ''}
                        {movement.quantity_change}
                      </TableCell>
                      <TableCell className="tnum text-right text-[12px] text-muted-foreground">
                        {movement.quantity_before} → {movement.quantity_after}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <span className="text-[12px]">{movement.reason || '—'}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {[movement.reference, movement.recorded_by].filter(Boolean).join(' · ') || 'No reference'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={pager.page}
                canGoPrev={pager.canGoPrev}
                canGoNext={Boolean(movementsQuery.data?.has_more)}
                onPrev={pager.goPrev}
                onNext={() => pager.goNext(movementsQuery.data?.next_cursor)}
                total={movements.length}
                totalLabel="movements"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {adjustTarget?.product && (
        <StockAdjustDialog
          open
          onOpenChange={(open) => !open && setAdjustTarget(null)}
          product={adjustTarget.product}
          onSubmit={(payload) => adjustMutation.mutateAsync(payload)}
        />
      )}
    </div>
  );
}
