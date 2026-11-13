export default function FormField({ label, htmlFor, error, hint, required = false, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="field-label block">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}