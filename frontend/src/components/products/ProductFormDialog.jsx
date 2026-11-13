import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import FormField from '@/components/common/FormField';
import { formatCurrency } from '@/lib/format';
import { importSelectedProductImage, searchProductImages, uploadProductImage } from '@/services/products';
import ProductImage from './ProductImage';

const EMPTY = {
  name: '',
  brand: '',
  sku: '',
  barcode: '',
  category: '',
  unit: 'pcs',
  cost_price: '',
  selling_price: '',
  stock_quantity: '',
  reorder_threshold: '5',
  description: '',
  image_url: '',
  image_metadata: null,
};

function validate(values) {
  const errors = {};
  if (!String(values.name).trim()) errors.name = 'Enter the product name.';
  if (!String(values.category).trim()) errors.category = 'Choose a category.';

  const selling = Number(values.selling_price);
  if (!Number.isFinite(selling) || selling <= 0) errors.selling_price = 'Selling price must be above zero.';

  const cost = Number(values.cost_price);
  if (values.cost_price !== '' && (!Number.isFinite(cost) || cost < 0)) errors.cost_price = 'Cost price cannot be negative.';

  const stock = Number(values.stock_quantity);
  if (values.stock_quantity !== '' && (!Number.isFinite(stock) || stock < 0)) errors.stock_quantity = 'Stock cannot be negative.';

  const reorder = Number(values.reorder_threshold);
  if (values.reorder_threshold !== '' && (!Number.isFinite(reorder) || reorder < 0)) {
    errors.reorder_threshold = 'Reorder level cannot be negative.';
  }
  return errors;
}

function toPayload(values, includeImage) {
  return {
    name: String(values.name).trim(),
    brand: String(values.brand).trim(),
    sku: String(values.sku).trim(),
    barcode: String(values.barcode).trim(),
    category: String(values.category).trim(),
    unit: String(values.unit).trim() || 'pcs',
    cost_price: Number(values.cost_price) || 0,
    selling_price: Number(values.selling_price) || 0,
    stock_quantity: Number(values.stock_quantity) || 0,
    reorder_threshold: values.reorder_threshold === '' ? 5 : Number(values.reorder_threshold),
    description: String(values.description).trim(),
    ...(includeImage ? {
      image_url: String(values.image_url ?? '').trim(),
      image_metadata: values.image_metadata ?? null,
    } : {}),
  };
}

export default function ProductFormDialog({ open, onOpenChange, product, categories = [], onSubmit, onDelete }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState(null);
  const [imageSearchResults, setImageSearchResults] = useState([]);
  const [imageSearchWarnings, setImageSearchWarnings] = useState([]);
  const [imageStorageConfigured, setImageStorageConfigured] = useState(true);
  const [imageSelection, setImageSelection] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [localPreview, setLocalPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setImageSearchOpen(false);
    setImageSearchError(null);
    setImageSearchResults([]);
    setImageSearchWarnings([]);
    setImageSelection(null);
    setImageFile(null);
    setImageChanged(false);
    setLocalPreview('');
    if (product) {
      setValues({
        name: product.name ?? '',
        brand: product.brand ?? '',
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        category: product.category ?? '',
        unit: product.unit ?? 'pcs',
        cost_price: product.cost_price ?? '',
        selling_price: product.selling_price ?? '',
        stock_quantity: product.stock_quantity ?? '',
        reorder_threshold: product.reorder_threshold ?? '5',
        description: product.description ?? '',
        image_url: product.image_url ?? '',
        image_metadata: product.image_metadata ?? null,
      });
    } else {
      setValues(EMPTY);
    }
  }, [open, product]);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const update = (field) => (event) => setValues((previous) => ({ ...previous, [field]: event.target.value }));
  const previewUrl = localPreview || imageSelection?.preview_url || values.image_url;

  const findImages = async () => {
    setImageSearchOpen(true);
    setImageSearchLoading(true);
    setImageSearchError(null);
    setImageSearchResults([]);
    setImageSearchWarnings([]);
    try {
      const result = await searchProductImages({
        name: values.name.trim(),
        brand: values.brand.trim(),
        category: values.category.trim(),
        barcode: values.barcode.trim(),
      });
      setImageSearchResults(result.items ?? []);
      setImageSearchWarnings(result.warnings ?? []);
      setImageStorageConfigured(result.storage_configured === true);
    } catch (error) {
      setImageSearchError(error.message || 'Product image search failed. Try again.');
    } finally {
      setImageSearchLoading(false);
    }
  };

  const selectImageFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Product images must be 5 MB or smaller.');
      return;
    }
    setFormError(null);
    setImageSelection(null);
    setImageFile(file);
    setImageChanged(true);
    setLocalPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageSelection(null);
    setImageFile(null);
    setImageChanged(true);
    setLocalPreview('');
    setValues((previous) => ({ ...previous, image_url: '', image_metadata: null }));
  };

  const margin =
    Number(values.selling_price) > 0 && Number(values.cost_price) >= 0 && values.selling_price !== ''
      ? Number(values.selling_price) - (Number(values.cost_price) || 0)
      : null;

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = toPayload(values, imageChanged);
      if (imageSelection) {
        const savedImage = await importSelectedProductImage(imageSelection.token);
        payload.image_url = savedImage.image_url;
        payload.image_metadata = savedImage.image_metadata;
      } else if (imageFile) {
        const savedImage = await uploadProductImage(imageFile);
        payload.image_url = savedImage.image_url;
        payload.image_metadata = savedImage.image_metadata;
      }
      await onSubmit(payload);
      setSaving(false);
      onOpenChange(false);
    } catch (error) {
      setSaving(false);
      setFormError(error?.message ?? 'The product could not be saved.');
    }
  };

  const deleting = Boolean(product?.id);

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? null : onOpenChange(next))}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deleting ? 'Edit product' : 'Add a product'}</DialogTitle>
          <DialogDescription>
            Prices are in the store currency. Stock changes made here are recorded as an opening balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Product name" htmlFor="product-name" error={errors.name} required className="sm:col-span-2">
              <Input id="product-name" value={values.name} onChange={update('name')} placeholder="e.g. Milo Refill 400g" autoFocus />
            </FormField>

            <FormField label="Brand" htmlFor="product-brand" hint="Used to find a closer product image match">
              <Input id="product-brand" value={values.brand} onChange={update('brand')} placeholder="e.g. Milo" />
            </FormField>

            <FormField label="Category" htmlFor="product-category" error={errors.category} required>
              <Input
                id="product-category"
                list="product-category-options"
                value={values.category}
                onChange={update('category')}
                placeholder="e.g. Beverages"
              />
              <datalist id="product-category-options">
                {categories.map((category) => (
                  <option key={category.id ?? category.name} value={category.name} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Unit" htmlFor="product-unit" hint="How it is sold — pcs, sachet, crate">
              <Input id="product-unit" value={values.unit} onChange={update('unit')} />
            </FormField>

            <FormField label="SKU" htmlFor="product-sku" hint="Your internal stock code">
              <Input id="product-sku" value={values.sku} onChange={update('sku')} placeholder="e.g. BEV-014" />
            </FormField>

            <FormField label="Barcode" htmlFor="product-barcode" hint="Scan the label or type the number">
              <Input id="product-barcode" value={values.barcode} onChange={update('barcode')} placeholder="e.g. 6151100123456" />
            </FormField>

            <FormField label="Cost price" htmlFor="product-cost" error={errors.cost_price} hint="What you pay your supplier">
              <Input id="product-cost" type="number" min="0" step="0.01" inputMode="decimal" value={values.cost_price} onChange={update('cost_price')} placeholder="0.00" />
            </FormField>

            <FormField
              label="Selling price"
              htmlFor="product-price"
              error={errors.selling_price}
              hint={margin !== null ? `Margin per unit: ${formatCurrency(margin)}` : 'What the customer pays'}
              required
            >
              <Input id="product-price" type="number" min="0" step="0.01" inputMode="decimal" value={values.selling_price} onChange={update('selling_price')} placeholder="0.00" />
            </FormField>

            <FormField label="Quantity in stock" htmlFor="product-stock" error={errors.stock_quantity}>
              <Input id="product-stock" type="number" min="0" step="1" inputMode="numeric" value={values.stock_quantity} onChange={update('stock_quantity')} placeholder="0" />
            </FormField>

            <FormField label="Reorder threshold" htmlFor="product-reorder" error={errors.reorder_threshold} hint="Flagged as low stock at or below this level">
              <Input id="product-reorder" type="number" min="0" step="1" inputMode="numeric" value={values.reorder_threshold} onChange={update('reorder_threshold')} />
            </FormField>

            <FormField label="Description (optional)" htmlFor="product-description" className="sm:col-span-2">
              <Input id="product-description" value={values.description} onChange={update('description')} placeholder="Size, pack, supplier notes" />
            </FormField>

            <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5 sm:col-span-2" aria-label="Product image">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ProductImage src={previewUrl} alt={values.name || 'Product preview'} className="h-20 w-20" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Product image</p>
                  {values.image_metadata?.attribution && !imageSelection && !imageFile ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {values.image_metadata.attribution} · {values.image_metadata.license}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Find a licensed image or upload your own (JPEG, PNG, WebP; up to 5 MB).</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={findImages} disabled={saving || imageSearchLoading || (!values.name.trim() && !values.barcode.trim())}>
                      {imageSearchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      Find product image
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                      <Upload className="h-3.5 w-3.5" />
                      Upload image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={selectImageFile}
                      aria-label="Upload product image"
                    />
                    {previewUrl && (
                      <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearImage} disabled={saving}>
                        <X className="h-3.5 w-3.5" />
                        Remove image
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {imageSearchOpen && (
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-foreground">Image suggestions</p>
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-muted-foreground" onClick={() => setImageSearchOpen(false)}>
                      <X className="h-3.5 w-3.5" />
                      Close
                    </Button>
                  </div>
                  {!imageStorageConfigured && !imageSearchLoading && (
                    <p role="status" className="rounded-lg border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
                      Image storage is not configured. An administrator must configure S3-compatible storage before images can be saved.
                    </p>
                  )}
                  {imageSearchWarnings.map((warning) => (
                    <p key={warning} className="text-xs text-warning">{warning}</p>
                  ))}
                  {imageSearchError && (
                    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
                      {imageSearchError}
                    </p>
                  )}
                  {imageSearchLoading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground" role="status">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching Open Food Facts and Wikimedia Commons…
                    </div>
                  ) : imageSearchResults.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {imageSearchResults.map((result) => (
                        <article key={result.token} className={`flex min-w-0 gap-3 rounded-lg border p-2.5 ${imageSelection?.token === result.token ? 'border-primary bg-success-muted/40' : 'border-border bg-card'}`}>
                          <ProductImage src={result.preview_url} alt="" className="h-16 w-16" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{result.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{result.source_name} · {result.license}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{result.attribution}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <Button type="button" size="sm" className="h-7 px-2.5 text-[11px]" onClick={() => { setImageSelection(result); setImageFile(null); setImageChanged(true); setLocalPreview(''); setFormError(null); }} disabled={!imageStorageConfigured || saving} aria-pressed={imageSelection?.token === result.token}>
                                <ImagePlus className="mr-1 h-3.5 w-3.5" />
                                {imageSelection?.token === result.token ? 'Selected' : 'Select'}
                              </Button>
                              <a href={result.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline underline-offset-2">
                                Source
                              </a>
                              {result.license_url && (
                                <a href={result.license_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline underline-offset-2">
                                  License
                                </a>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : !imageSearchError && !imageSearchLoading ? (
                    <p className="py-2 text-xs text-muted-foreground">No licensed image matches were found. Try a brand or barcode, or upload an image.</p>
                  ) : null}
                </div>
              )}
            </section>
          </div>

          {margin !== null && margin < 0 && (
            <p className="rounded-lg border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
              This product is priced below cost — every sale at this price loses money.
            </p>
          )}

          {formError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {deleting && onDelete && (
                <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => onDelete(product)} disabled={saving}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deleting ? 'Save changes' : 'Add product'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}