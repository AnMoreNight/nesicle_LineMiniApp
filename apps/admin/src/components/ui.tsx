import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-surface p-6 shadow-card ${className}`}>{children}</div>;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50",
    secondary: "bg-surface-muted text-ink hover:bg-border disabled:opacity-50",
    danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white disabled:opacity-50",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  className = "",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: ReactNode;
}) {
  const variantClasses =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-hover"
      : "bg-surface-muted text-ink hover:bg-border";
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm font-medium transition-colors ${variantClasses} ${className}`}
    >
      {children}
    </a>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {/* Field-wrapped inputs always span the full width of the form; filter-bar inputs
          (used outside Field) size themselves via their own className instead. */}
      <div className="[&>input]:w-full [&>select]:w-full [&>textarea]:w-full">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

// NOTE: intentionally no width utility here — callers control width via className
// (form fields pass "w-full", filter bars pass a fixed width) so there is never a
// same-specificity Tailwind class conflict to resolve.
const inputClasses =
  "rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-muted disabled:text-ink-muted";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-ink-muted">{message}</div>;
}

export function LoadingState() {
  return <div className="p-10 text-center text-sm text-ink-muted">読み込み中...</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-lg border border-danger-soft bg-danger-soft p-4 text-sm text-danger">{message}</div>;
}
