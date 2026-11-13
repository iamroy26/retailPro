import { cn } from '@/lib/utils';

export default function PageHeader({ title, description, actions, children, className }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}