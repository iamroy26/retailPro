import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { paymentMethodLabel } from '@/lib/format';

const ICONS = { cash: Banknote, card: CreditCard, mobile_money: Smartphone };
const STYLES = {
  cash: 'border-success/25 bg-success-muted text-success',
  card: 'border-primary/20 bg-primary/10 text-primary',
  mobile_money: 'border-warning/30 bg-warning-muted text-warning',
};

export default function PaymentMethodBadge({ method, className }) {
  const Icon = ICONS[method] ?? Banknote;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        STYLES[method] ?? 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {paymentMethodLabel(method)}
    </span>
  );
}