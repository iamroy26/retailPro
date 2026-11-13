export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-heading text-sm font-semibold">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}