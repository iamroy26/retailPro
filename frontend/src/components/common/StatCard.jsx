import { cn } from '@/lib/utils';

const TONES = {
  default: 'text-foreground',
  positive: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

const ICON_TONES = {
  default: 'bg-primary/10 text-primary',
  positive: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

/**
 * A headline figure. When a value genuinely cannot be calculated the card says
 * so instead of showing a zero that looks like a real result.
 */
export default function StatCard({ label, value, hint, icon: Icon, tone = 'default', unavailable = false }) {
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', ICON_TONES[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={cn('tnum mt-3 font-heading text-2xl font-semibold tracking-tight', TONES[tone])}>
        {unavailable ? '—' : value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}