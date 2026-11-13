import { cn } from '@/lib/utils';
import type { StatusBadgeData, StatusTone } from '@/lib/status';

const toneClass: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success-soft-foreground',
  warning: 'bg-warning-soft text-warning-soft-foreground',
  danger: 'bg-destructive-soft text-destructive-soft-foreground',
  info: 'bg-info-soft text-info-soft-foreground',
  brand: 'bg-accent text-accent-foreground',
  neutral: 'bg-neutral-soft text-neutral-soft-foreground',
};

const dotClass: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  brand: 'bg-primary',
  neutral: 'bg-muted-foreground',
};

interface StatusBadgeProps extends Partial<StatusBadgeData> {
  className?: string;
  /** Show a leading dot (useful in dense tables). */
  dot?: boolean;
  title?: string;
}

/** The only badge used for statuses across the app, so the same state always looks the same. */
export function StatusBadge({ tone = 'neutral', label, dot = false, className, title }: StatusBadgeProps) {
  if (!label) return null;
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        toneClass[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dotClass[tone])} /> : null}
      {label}
    </span>
  );
}
