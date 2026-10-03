import { useRef, useState, type MouseEvent } from "react";
import { Container } from "../../components/common/Container";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { PARTS_CATALOG } from "../../data/parts";
import { fromCropRelative } from "../../lib/partGeometry";
import type { ChildAttachmentPoint, NormalizedPoint, PartAttachment, PartCategory } from "../../types/catalog";

const DISPLAY_SIZE = 320;
const CATEGORIES: PartCategory[] = ["connecting", "charm", "decoration"];

/**
 * Dev-only tool: click on a part's (cropped) image to record attachment
 * points, then export the exact snippet to paste into
 * src/data/attachmentOverrides.ts. Not linked from any customer-facing nav —
 * reach it directly at /dev/attachment-editor.
 */
export function AttachmentEditor() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"self" | "child">("self");
  const [selfPoint, setSelfPoint] = useState<NormalizedPoint | null>(null);
  const [childPoints, setChildPoints] = useState<ChildAttachmentPoint[]>([]);
  const [acceptCats, setAcceptCats] = useState<PartCategory[]>(["charm"]);
  const [exported, setExported] = useState<string | null>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const part = selectedId ? PARTS_CATALOG.find((p) => p.id === selectedId) : null;
  const filtered = PARTS_CATALOG.filter((p) => p.id.toLowerCase().includes(query.toLowerCase())).slice(0, 60);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!part) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cropRel = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    const full = fromCropRelative(cropRel, part.visualBounds);
    if (mode === "self") {
      setSelfPoint(full);
    } else {
      setChildPoints((prev) => [
        ...prev,
        { id: `slot-${prev.length + 1}`, point: full, acceptsCategories: acceptCats },
      ]);
    }
  };

  const exportJson = () => {
    if (!part) return;
    const attachment: PartAttachment = {
      ...(selfPoint ? { attachmentPoint: { x: Number(selfPoint.x.toFixed(4)), y: Number(selfPoint.y.toFixed(4)) } } : {}),
      ...(childPoints.length
        ? {
            childAttachmentPoints: childPoints.map((c) => ({
              ...c,
              point: { x: Number(c.point.x.toFixed(4)), y: Number(c.point.y.toFixed(4)) },
            })),
          }
        : {}),
      reviewStatus: "manually_set",
    };
    const snippet = `  ${part.id}: ${JSON.stringify(attachment, null, 2).replace(/\n/g, "\n  ")},`;
    navigator.clipboard?.writeText(snippet).catch(() => {});
    setExported(snippet);
  };

  return (
    <Container className="py-10 pb-24">
      <h1 className="font-serif text-2xl text-graphite">Attachment Point Editor (dev)</h1>
      <p className="mt-1 text-sm text-graphite-soft">
        Click the image to place a point. Export copies a snippet for <code>attachmentOverrides.ts</code>.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by id..."
            className="mb-3 w-full rounded-xl border border-graphite/15 px-3 py-2 text-sm"
          />
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(p.id);
                    setSelfPoint(p.attachment?.attachmentPoint ?? null);
                    setChildPoints(p.attachment?.childAttachmentPoints ?? []);
                  }}
                  className={`rounded-lg border p-1 ${selectedId === p.id ? "border-champagne" : "border-graphite/10"}`}
                  title={p.id}
                >
                  <img src={p.imageUrl} alt={p.id} className="h-10 w-10 object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {!part && <p className="text-graphite-soft">Select a part from the catalog on the left.</p>}
          {part && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Chip active={mode === "self"} onClick={() => setMode("self")}>Set self attach point</Chip>
                <Chip active={mode === "child"} onClick={() => setMode("child")}>Add child point</Chip>
                {mode === "child" &&
                  CATEGORIES.map((c) => (
                    <Chip
                      key={c}
                      active={acceptCats.includes(c)}
                      onClick={() =>
                        setAcceptCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
                      }
                    >
                      accepts: {c}
                    </Chip>
                  ))}
              </div>

              <div
                ref={imgWrapRef}
                onClick={handleClick}
                className="relative cursor-crosshair overflow-hidden rounded-2xl bg-stone"
                style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
              >
                <img src={part.imageUrl} alt={part.id} className="h-full w-full object-contain" draggable={false} />
                {selfPoint && part.visualBounds && (
                  <Marker point={selfPoint} bounds={part.visualBounds} color="#c9a86a" label="self" />
                )}
                {childPoints.map((c) =>
                  part.visualBounds ? (
                    <Marker key={c.id} point={c.point} bounds={part.visualBounds} color="#5b7fa6" label={c.id} />
                  ) : null,
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setChildPoints([])}>
                  Clear child points
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelfPoint(null)}>
                  Clear self point
                </Button>
                <Button size="sm" onClick={exportJson}>
                  Export JSON
                </Button>
              </div>

              {exported && (
                <pre className="mt-3 max-h-60 overflow-auto rounded-xl bg-graphite p-3 text-xs text-ivory">
                  {exported}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

function Marker({
  point,
  bounds,
  color,
  label,
}: {
  point: NormalizedPoint;
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
  label: string;
}) {
  const cropRel = { x: (point.x - bounds.x) / bounds.width, y: (point.y - bounds.y) / bounds.height };
  return (
    <div
      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${cropRel.x * 100}%`, top: `${cropRel.y * 100}%` }}
    >
      <span className="h-3 w-3 rounded-full border-2 border-white" style={{ background: color }} />
      <span className="mt-0.5 rounded bg-graphite/80 px-1 text-[9px] text-ivory">{label}</span>
    </div>
  );
}
