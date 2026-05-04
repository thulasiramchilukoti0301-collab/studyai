import { cn } from '@/src/lib/utils';

export const Icon = ({
  name,
  className,
  fill = false,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) => (
  <span
    className={cn('material-symbols-outlined', fill && 'material-fill', className)}
    aria-hidden="true"
  >
    {name}
  </span>
);
