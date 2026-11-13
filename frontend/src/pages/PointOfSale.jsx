import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, PackageSearch, ScanLine, Search, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import ProductTile from '@/components/pos/ProductTile';
import CartPanel from '@/components/pos/CartPanel';
import PaymentDialog from '@/components/pos/PaymentDialog';
import ReceiptDialog from '@/components/pos/ReceiptDialog';
import { useSettings } from '@/hooks/useSettings';
import { findProductByCode, listSellableProducts } from '@/services/products';
import { listCategories } from '@/services/categories';
import { createSale } from '@/services/sales';
import { computeCartTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function PointOfSale() {
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';
  const threshold = Number(settings.low_stock_threshold) || 5;
  const taxRate = Number(settings.tax_rate) || 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [barcode, setBarcode] = useState('');
  const [scanError, setScanError] = useState(null);
  const [lines, setLines] = useState([]);
  const [discount, setDiscount] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const productsQuery = useQuery({
    queryKey: ['pos-products', debouncedSearch, category],
    queryFn: () => listSellableProducts({ search: debouncedSearch, category, limit: 120 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => listCategories({ includeInactive: false, limit: 100 }),
  });

  const products = productsQuery.data?.items ?? [];
  const categories = categoriesQuery.data?.items ?? [];
  const totals = useMemo(
    () => computeCartTotals(lines, { discount: Number(discount) || 0, taxRate }),
    [lines, discount, taxRate],
  );

  const cartCountByProduct = useMemo(() => {
    const map = new Map();
    lines.forEach((line) => map.set(line.product_id, line.quantity));
    return map;
  }, [lines]);

  const addToCart = (product) => {
    const available = Number(product.stock_quantity) || 0;
    if (available <= 0) return;
    setLines((previous) => {
      const existing = previous.find((line) => line.product_id === product.id);
      if (existing) {
        if (existing.quantity >= available) return previous;
        return previous.map((line) =>
          line.product_id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...previous,
        {
          product_id: product.id,
          name: product.name,
          image_url: product.image_url ?? '',
          sku: product.sku ?? '',
          unit: product.unit ?? 'pcs',
          unit_price: Number(product.selling_price) || 0,
          cost_price: Number(product.cost_price) || 0,
          stock_available: available,
          quantity: 1,
        },
      ];
    });
  };

  const increment = (line) =>
    setLines((previous) =>
      previous.map((item) =>
        item.product_id === line.product_id && item.quantity < item.stock_available
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );

  const decrement = (line) =>
    setLines((previous) =>
      previous
        .map((item) => (item.product_id === line.product_id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );

  const removeLine = (line) =>
    setLines((previous) => previous.filter((item) => item.product_id !== line.product_id));

  const clearCart = () => {
    setLines([]);
    setDiscount('');
  };

  const handleScan = async (event) => {
    event.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    try {
      const product = await findProductByCode(code);
      if (!product) {
        setScanError(`No product matches “${code}”. Check the barcode or SKU.`);
        return;
      }
      if ((Number(product.stock_quantity) || 0) <= 0) {
        setScanError(`${product.name} is out of stock.`);
        return;
      }
      addToCart(product);
      setBarcode('');
      setScanError(null);
      toast({ title: `${product.name} added`, description: 'Scanned item added to the cart.' });
    } catch (error) {
      setScanError(error?.message ?? 'That code could not be looked up.');
    }
  };

  const completeSale = async (payload) => {
    const result = await createSale(payload);
    setReceiptSale(result?.sale ?? null);
    setReceiptOpen(Boolean(result?.sale));
    setPaymentOpen(false);
    clearCart();
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    return result;
  };

  const cartPanelProps = {
    lines: totals.lines,
    totals,
    currency,
    discount,
    onDiscountChange: setDiscount,
    onIncrement: increment,
    onDecrement: decrement,
    onRemove: removeLine,
    onClear: clearCart,
    onCheckout: () => {
      setMobileCartOpen(false);
      setPaymentOpen(true);
    },
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-24 lg:pb-0">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
            Point of Sale
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Scan or tap to build the cart. Stock is checked again on the server before the sale is saved.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Prices in {currency}
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Low stock at {threshold}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_368px] xl:gap-6">
        <div className="min-w-0 space-y-4">
          <form onSubmit={handleScan} className="surface flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products by name, SKU or category"
                className="h-11 pl-9 pr-9"
                aria-label="Search products"
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
            <div className="relative sm:w-64">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={barcode}
                onChange={(event) => {
                  setBarcode(event.target.value);
                  setScanError(null);
                }}
                placeholder="Scan barcode or type SKU"
                className="h-11 pl-9 font-mono text-sm"
                aria-label="Barcode"
                autoComplete="off"
              />
            </div>
            <Button type="submit" variant="outline" className="h-11">
              Add scanned item
            </Button>
          </form>

          {scanError && (
            <p role="alert" className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {scanError}
            </p>
          )}

          <div className="thin-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <Button
              variant={category === 'all' ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => setCategory('all')}
            >
              All products
            </Button>
            {categories.map((item) => (
              <Button
                key={item.id}
                variant={category === item.name ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => setCategory(item.name)}
              >
                {item.name}
              </Button>
            ))}
            {category !== 'all' && !categories.some((item) => item.name === category) && (
              <Button variant="default" size="sm" className="shrink-0 rounded-full" onClick={() => setCategory('all')}>
                {category}
              </Button>
            )}
          </div>

          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="surface h-[124px] p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                  <Skeleton className="mt-8 h-5 w-20" />
                </div>
              ))}
            </div>
          ) : productsQuery.isError ? (
            <ErrorState
              title="Products could not be loaded"
              error={productsQuery.error}
              onRetry={() => productsQuery.refetch()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products match"
              description={
                debouncedSearch
                  ? `Nothing found for “${debouncedSearch}”. Try a different spelling, SKU or category.`
                  : 'Add products to the catalogue and they will appear here ready to sell.'
              }
            />
          ) : (
            <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4')}>
              {products.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  currency={currency}
                  threshold={threshold}
                  inCart={cartCountByProduct.get(product.id) ?? 0}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}

          {products.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground">
              Showing {products.length} product{products.length === 1 ? '' : 's'}
              {productsQuery.data?.has_more ? ' — narrow the search to see more' : ''}
            </p>
          )}
        </div>

        <aside className="surface sticky top-24 hidden h-[calc(100vh-8rem)] min-h-[520px] overflow-hidden lg:flex lg:flex-col">
          <CartPanel {...cartPanelProps} />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} in cart
            </p>
            <p className="tnum font-heading text-lg font-semibold">{formatCurrency(totals.total, currency)}</p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setMobileCartOpen(true)} disabled={lines.length === 0}>
            <ShoppingCart className="h-4 w-4" />
            View cart
          </Button>
        </div>
      </div>

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="h-[86vh] rounded-t-2xl p-0">
          <SheetTitle className="sr-only">Current sale</SheetTitle>
          <CartPanel {...cartPanelProps} />
        </SheetContent>
      </Sheet>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        lines={lines}
        totals={totals}
        currency={currency}
        taxRate={taxRate}
        onComplete={completeSale}
      />

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={receiptSale}
        settings={settings}
        onStartNext={() => {
          setReceiptOpen(false);
          setReceiptSale(null);
        }}
      />
    </div>
  );
}