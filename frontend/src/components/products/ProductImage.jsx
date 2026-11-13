import { useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductImage({ src, alt, className = '' }) {
  const [failedSource, setFailedSource] = useState('');
  const failed = failedSource === src;

  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted/60', className)}>
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedSource(src)} />
      ) : (
        <Package aria-hidden="true" className="h-5 w-5 text-muted-foreground/60" />
      )}
    </span>
  );
}
