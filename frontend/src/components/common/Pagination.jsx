import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Cursor-based paging: the data layer pages by cursor, not by offset. */
export default function Pagination({ page, canGoPrev, canGoNext, onPrev, onNext, total, totalLabel = 'records' }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {typeof total === 'number' ? `${total} ${totalLabel} on this page` : `Page ${page}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={onPrev} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="tnum px-1 text-xs font-medium text-muted-foreground">Page {page}</span>
        <Button variant="outline" size="sm" disabled={!canGoNext} onClick={onNext} className="gap-1">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}