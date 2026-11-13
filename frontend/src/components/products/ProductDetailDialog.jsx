import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StockBadge from '@/components/common/StockBadge';
import { formatCurrency, formatDateTime } from '@/lib/format';
import ProductImage from './ProductImage';

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export default function ProductDetailDialog({ open, onOpenChange, product, currency, threshold, onEdit }) {
  if (!product) return null;
  const margin = (Number(product.selling_price) || 0) - (Number(product.cost_price) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">{product.name}</DialogTitle>
          <DialogDescription>
            {[product.brand, product.category || 'Uncategorised'].filter(Boolean).join(' · ')}
            {product.sku ? ` · ${product.sku}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3">
          <ProductImage src={product.image_url} alt={product.name} className="h-20 w-20" />
          {product.image_metadata?.attribution && (
            <p className="min-w-0 pt-1 text-xs text-muted-foreground">
              {product.image_metadata.attribution}
              {product.image_metadata.license && <span className="block mt-1">{product.image_metadata.license}</span>}
              {product.image_metadata.source_url && (
                <a href={product.image_metadata.source_url} target="_blank" rel="noreferrer" className="mt-1 block text-primary underline underline-offset-2">
                  Image source
                </a>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <StockBadge product={product} threshold={threshold} />
          {product.is_archived && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Archived
            </span>
          )}
        </div>

        <div>
          <Row label="Selling price">{formatCurrency(product.selling_price, currency)}</Row>
          <Row label="Cost price">{formatCurrency(product.cost_price, currency)}</Row>
          <Row label="Margin per unit">
            <span className={margin < 0 ? 'text-destructive' : 'text-success'}>{formatCurrency(margin, currency)}</span>
          </Row>
          <Row label="Reorder level">{product.reorder_threshold ?? threshold}</Row>
          <Row label="Barcode">{product.barcode || '—'}</Row>
          <Row label="Unit">{product.unit || 'pcs'}</Row>
          <Row label="Last updated">{formatDateTime(product.updated_date)}</Row>
        </div>

        {product.description && (
          <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">{product.description}</p>
        )}

        <DialogFooter>
          <Button variant="outline" className="gap-2" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
            Edit product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}