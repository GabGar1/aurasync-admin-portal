import { useState } from 'react';
import { Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductThumbProps {
  src?: string | null;
  alt: string;
  className?: string;
}

/** Product photo from Nuvemshop, with a neutral placeholder when there is none or it fails to load. */
export function ProductThumb({ src, alt, className }: ProductThumbProps) {
  const [failed, setFailed] = useState(false);
  const base = cn('h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted', className);

  if (!src || failed) {
    return (
      <span className={cn(base, 'flex items-center justify-center text-muted-foreground')} aria-hidden>
        <Gem className="h-4 w-4" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(base, 'object-cover')}
      onError={() => setFailed(true)}
    />
  );
}
