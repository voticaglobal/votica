import type { BuildItem } from "../../types/builder";

/** Renders a part as its real cropped photo, or as a simple vector shape when no photo exists yet. */
export function PartShape({ item, className }: { item: BuildItem; className?: string }) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.label}
        draggable={false}
        className={className}
        style={{ width: item.width, height: item.height, objectFit: "contain" }}
      />
    );
  }

  const { shape = "gem", color = "#c9a86a", width, height } = item;
  const w = width;
  const h = height;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      {shape === "stud" && <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 1} fill={color} />}
      {shape === "ring" && (
        <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 2} fill="none" stroke={color} strokeWidth={3} />
      )}
      {shape === "hook" && (
        <path
          d={`M ${w / 2} 2 C ${w / 2 + w / 2} 2, ${w / 2 + w / 2} ${h / 2}, ${w / 2} ${h / 2} L ${w / 2} ${h - 4}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      {shape === "bar" && <rect x={1} y={h / 2 - 2} width={w - 2} height={4} rx={2} fill={color} />}
      {shape === "drop" && (
        <path
          d={`M ${w / 2} 1 C ${w - 1} ${h * 0.4}, ${w - 1} ${h - 1}, ${w / 2} ${h - 1} C 1 ${h - 1}, 1 ${h * 0.4}, ${w / 2} 1 Z`}
          fill={color}
        />
      )}
      {shape === "star" && (
        <polygon
          points={starPoints(w / 2, h / 2, Math.min(w, h) / 2 - 1, Math.min(w, h) / 4.5)}
          fill={color}
        />
      )}
      {shape === "heart" && (
        <path
          d={`M ${w / 2} ${h - 1} C -${w * 0.1} ${h * 0.55}, ${w * 0.1} 1, ${w / 2} ${h * 0.3} C ${w * 0.9} 1, ${w * 1.1} ${h * 0.55}, ${w / 2} ${h - 1} Z`}
          fill={color}
        />
      )}
      {shape === "gem" && (
        <polygon
          points={`${w / 2},0 ${w},${h * 0.35} ${w * 0.75},${h} ${w * 0.25},${h} 0,${h * 0.35}`}
          fill={color}
          stroke="white"
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      )}
    </svg>
  );
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(" ");
}
