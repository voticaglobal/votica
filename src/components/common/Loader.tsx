export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-graphite/15 border-t-champagne" />
      {label && <p className="text-sm text-graphite-soft">{label}</p>}
    </div>
  );
}
