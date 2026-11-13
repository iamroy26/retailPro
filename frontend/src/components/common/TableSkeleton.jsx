import { Skeleton } from '@/components/ui/skeleton';

export default function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={`h-4 ${columnIndex === 0 ? 'w-48' : 'w-24'}`}
                style={{ opacity: 1 - rowIndex * 0.08 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}