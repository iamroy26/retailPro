import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import ProductImage from '@/components/products/ProductImage';

export default function CartLine({ line, currency, onIncrement, onDecrement, onRemove }) {
  const atLimit = line.quantity >= (Number(line.stock_available) || 0);

  return (
    <li className="flex items-start gap-3 px-3.5 py-3">
      <ProductImage src={line.image_url} alt="" className="h-11 w-11" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{line.name}</p>
        <p className="tnum mt-0.5 text-[11px] text-muted-foreground">
          {formatCurrency(line.unit_price, currency)} each · {line.stock_available} in stock
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => onDecrement(line)}
            aria-label={`Reduce ${line.name}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="tnum w-8 text-center text-sm font-semibold">{line.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => onIncrement(line)}
            disabled={atLimit}
            aria-label={`Add one more ${line.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          {atLimit && <span className="text-[11px] text-warning">Stock limit</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="tnum text-sm font-semibold">{formatCurrency(line.line_total, currency)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(line)}
          aria-label={`Remove ${line.name} from the cart`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}