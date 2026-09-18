export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="読み込み中"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center text-ink-muted">
      <Spinner />
    </div>
  );
}
