import { Archive, ArchiveRestore, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StockBadge from '@/components/common/StockBadge';
import { formatCurrency } from '@/lib/format';
import ProductImage from './ProductImage';

/**
 * One product table for desktop and a card list for small screens — the same
 * records, presented for the space available.
 */
export default function ProductsTable({ products, currency, threshold, onView, onEdit, onArchive, onRestore }) {
  return (
    <>
      <div className="surface hidden overflow-hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[34%]">Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const margin = (Number(product.selling_price) || 0) - (Number(product.cost_price) || 0);
              return (
                <TableRow key={product.id} className={product.is_archived ? 'opacity-60' : undefined}>
                  <TableCell>
                    <button type="button" onClick={() => onView(product)} className="flex items-center gap-3 text-left">
                      <ProductImage src={product.image_url} alt="" className="h-10 w-10" />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium hover:text-primary hover:underline">{product.name}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {[product.brand, product.sku || 'No SKU', product.is_archived ? 'archived' : ''].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{product.category || '—'}</TableCell>
                  <TableCell className="tnum text-right text-[13px] text-muted-foreground">
                    {formatCurrency(product.cost_price, currency)}
                  </TableCell>
                  <TableCell className="tnum text-right text-[13px] font-medium">
                    {formatCurrency(product.selling_price, currency)}
                  </TableCell>
                  <TableCell className={`tnum text-right text-[13px] ${margin < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatCurrency(margin, currency)}
                  </TableCell>
                  <TableCell>
                    <StockBadge product={product} threshold={threshold} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(product)} aria-label={`View ${product.name}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {product.is_archived ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRestore(product)} aria-label={`Restore ${product.name}`}>
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onArchive(product)} aria-label={`Archive ${product.name}`}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 lg:hidden">
        {products.map((product) => (
          <li key={product.id} className="surface p-3.5">
            <div className="flex items-start justify-between gap-3">
              <button type="button" className="min-w-0 text-left" onClick={() => onView(product)}>
                <span className="flex min-w-0 items-center gap-3">
                  <ProductImage src={product.image_url} alt="" className="h-11 w-11" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{product.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {[product.brand, product.category || 'Uncategorised', product.sku || 'No SKU'].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </span>
              </button>
              <StockBadge product={product} threshold={threshold} className="shrink-0" />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="flex gap-4 text-[11px] text-muted-foreground">
                <span className="tnum">Cost {formatCurrency(product.cost_price, currency)}</span>
                <span className="tnum font-medium text-foreground">Price {formatCurrency(product.selling_price, currency)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onEdit(product)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {product.is_archived ? (
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => onRestore(product)}>
                    Restore
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => onArchive(product)}>
                    Archive
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}