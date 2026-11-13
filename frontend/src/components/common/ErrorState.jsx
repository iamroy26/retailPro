import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Failures are shown as failures — never smoothed over with empty numbers. */
export default function ErrorState({ title = 'That did not load', description, error, onRetry }) {
  const detail = description || error?.message || 'Something went wrong while loading this view.';
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/[0.04] px-6 py-12 text-center">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="font-heading text-sm font-semibold">{title}</p>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{detail}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}