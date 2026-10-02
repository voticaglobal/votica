import { Plus, Gem, Sparkles, Eye } from "lucide-react";

export function StudioToolbar({
  onAddCharm,
  onMaterial,
  onAiCharm,
  onPreview,
}: {
  onAddCharm: () => void;
  onMaterial: () => void;
  onAiCharm: () => void;
  onPreview: () => void;
}) {
  const items = [
    { label: "Add Charm", icon: Plus, onClick: onAddCharm },
    { label: "Material", icon: Gem, onClick: onMaterial },
    { label: "AI Charm", icon: Sparkles, onClick: onAiCharm },
    { label: "Preview", icon: Eye, onClick: onPreview },
  ];

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-graphite/10 bg-ivory/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-1 py-3 text-graphite-soft transition-colors hover:text-graphite active:text-champagne"
          >
            <Icon size={20} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
