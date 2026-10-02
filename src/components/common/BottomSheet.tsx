import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-graphite/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-ivory p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="mx-auto -mt-1 mb-1 h-1 w-10 rounded-full bg-graphite/15 sm:hidden absolute left-1/2 top-2 -translate-x-1/2" />
          {title && <h3 className="text-lg font-medium text-graphite">{title}</h3>}
          <button
            aria-label="Close sheet"
            onClick={onClose}
            className="ml-auto rounded-full p-2 text-graphite-soft hover:bg-stone"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
