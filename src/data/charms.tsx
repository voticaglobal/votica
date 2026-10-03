import type { CharmType, MaterialType } from "../types/jewelry";

export type CharmLibraryItem = {
  type: CharmType;
  label: string;
  description: string;
};

export const CHARM_LIBRARY: CharmLibraryItem[] = [
  { type: "heart", label: "Heart", description: "A soft, rounded heart." },
  { type: "star", label: "Star", description: "A five-point star." },
  { type: "paw", label: "Paw", description: "A gentle paw print." },
  { type: "moon", label: "Moon", description: "A crescent moon." },
  { type: "gem", label: "Gem", description: "A faceted little gem." },
  { type: "initial", label: "Initial", description: "One or two letters." },
  { type: "custom", label: "AI Charm", description: "Made from your photo." },
];

export function materialGradientId(material: MaterialType): string {
  return `vandida-material-${material}`;
}

/** Shared metallic gradients, rendered once per canvas and referenced by every charm/hoop shape. */
export function MaterialDefs() {
  return (
    <defs>
      <linearGradient id={materialGradientId("silver")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f4f5f6" />
        <stop offset="45%" stopColor="#cfd3d8" />
        <stop offset="100%" stopColor="#9ea3aa" />
      </linearGradient>
      <linearGradient id={materialGradientId("gold-vermeil")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f3e1b5" />
        <stop offset="45%" stopColor="#d4ad64" />
        <stop offset="100%" stopColor="#a97f3c" />
      </linearGradient>
      <linearGradient id={materialGradientId("rose-gold")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f1d3c8" />
        <stop offset="45%" stopColor="#d9a897" />
        <stop offset="100%" stopColor="#b97e6c" />
      </linearGradient>
      <clipPath id="vandida-charm-clip">
        <circle r="8.3" />
      </clipPath>
      {/* Pale gradient edges (esp. rose-gold) can nearly vanish against the ivory/stone preview
          background — a soft shadow keeps every charm legible regardless of material or backdrop. */}
      <filter id="vandida-charm-shadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1" stdDeviation="0.9" floodColor="#2b2926" floodOpacity="0.35" />
      </filter>
    </defs>
  );
}

type CharmShapeProps = {
  material: MaterialType;
  text?: string;
};

/** Each charm is a self-contained ~24x24 unit shape centered on (0,0), scaled/positioned by the caller. */
function HeartShape({ material }: CharmShapeProps) {
  return (
    <path
      d="M0 8 C-8 0 -8 -9 -1.5 -9 C0.5 -9 0 -6.5 0 -6.5 C0 -6.5 -0.5 -9 1.5 -9 C8 -9 8 0 0 8 Z"
      fill={`url(#${materialGradientId(material)})`}
      stroke="rgba(43,41,38,0.4)"
      strokeWidth={0.6}
    />
  );
}

function StarShape({ material }: CharmShapeProps) {
  const points = [0, -9, 2.1, -2.8, 9, -2.8, 3.4, 1.7, 5.5, 9, 0, 4.3, -5.5, 9, -3.4, 1.7, -9, -2.8, -2.1, -2.8]
    .reduce<string>((acc, v, i, arr) => (i % 2 === 0 ? `${acc}${v},${arr[i + 1]} ` : acc), "");
  return (
    <polygon
      points={points}
      fill={`url(#${materialGradientId(material)})`}
      stroke="rgba(43,41,38,0.4)"
      strokeWidth={0.6}
    />
  );
}

function PawShape({ material }: CharmShapeProps) {
  const fill = `url(#${materialGradientId(material)})`;
  return (
    <g fill={fill} stroke="rgba(43,41,38,0.4)" strokeWidth={0.5}>
      <ellipse cx="0" cy="3" rx="6" ry="5" />
      <ellipse cx="-6" cy="-4" rx="2.4" ry="3" />
      <ellipse cx="-2" cy="-7" rx="2.4" ry="3" />
      <ellipse cx="2" cy="-7" rx="2.4" ry="3" />
      <ellipse cx="6" cy="-4" rx="2.4" ry="3" />
    </g>
  );
}

function MoonShape({ material }: CharmShapeProps) {
  return (
    <path
      d="M4 -9 A9 9 0 1 0 4 9 A7 7 0 1 1 4 -9 Z"
      fill={`url(#${materialGradientId(material)})`}
      stroke="rgba(43,41,38,0.4)"
      strokeWidth={0.6}
    />
  );
}

function GemShape({ material }: CharmShapeProps) {
  return (
    <polygon
      points="0,-9 6,-3 3.5,9 -3.5,9 -6,-3"
      fill={`url(#${materialGradientId(material)})`}
      stroke="rgba(0,0,0,0.2)"
      strokeWidth={0.6}
    />
  );
}

function InitialShape({ material, text }: CharmShapeProps) {
  return (
    <g>
      <circle
        r="9"
        fill={`url(#${materialGradientId(material)})`}
        stroke="rgba(43,41,38,0.4)"
        strokeWidth={0.6}
      />
      <text
        x="0"
        y="3.2"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Fraunces, serif"
        fill="rgba(0,0,0,0.55)"
      >
        {(text || "A").slice(0, 2).toUpperCase()}
      </text>
    </g>
  );
}

/** Real catalog photo, shown at its own aspect ratio rather than forced into the circular vector-charm clip. */
function PartImageShape({ imageUrl }: { imageUrl: string }) {
  return (
    <image
      href={imageUrl}
      x={-10}
      y={-10}
      width={20}
      height={20}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function CustomShape({ material, assetUrl }: CharmShapeProps & { assetUrl?: string }) {
  return (
    <g>
      <circle
        r="9"
        fill={assetUrl ? "#fff" : `url(#${materialGradientId(material)})`}
        stroke="rgba(43,41,38,0.4)"
        strokeWidth={0.6}
      />
      {assetUrl ? (
        <image
          href={assetUrl}
          x="-8.3"
          y="-8.3"
          width="16.6"
          height="16.6"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#vandida-charm-clip)"
        />
      ) : (
        <>
          <path
            d="M-4 3 C-4 0 -3 -3 0 -3 C3 -3 4 0 4 3"
            fill="none"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={1}
            strokeLinecap="round"
          />
          <circle cx="0" cy="-1.5" r="1.2" fill="rgba(0,0,0,0.4)" />
        </>
      )}
      <circle r="9" fill="none" stroke={`url(#${materialGradientId(material)})`} strokeWidth={1.4} />
    </g>
  );
}

/**
 * Real charms hang from the hoop by a soldered/opened jump ring rather than a
 * direct weld — no charm here should render without one. Drawn at the local
 * origin (the attachment point itself) so it visually loops around the hoop
 * wire; the charm body is rendered separately, shifted down to hang below it.
 */
export function CharmJumpRing({ material }: { material: MaterialType }) {
  return (
    <ellipse
      cx="0"
      cy="-3"
      rx="2.8"
      ry="4"
      fill="none"
      stroke={`url(#${materialGradientId(material)})`}
      strokeWidth={1.3}
    />
  );
}

/** Vertical offset applied to a charm body so it hangs below its jump ring instead of centering on the hoop wire. */
export const CHARM_HANG_OFFSET = 7;

export function CharmShape({
  type,
  material,
  text,
  customAssetUrl,
  partImageUrl,
}: {
  type: CharmType;
  material: MaterialType;
  text?: string;
  customAssetUrl?: string;
  /** Resolved by the caller from `charm.partId` — this module stays decoupled from the catalog data. */
  partImageUrl?: string;
}) {
  switch (type) {
    case "heart":
      return <HeartShape material={material} />;
    case "star":
      return <StarShape material={material} />;
    case "paw":
      return <PawShape material={material} />;
    case "moon":
      return <MoonShape material={material} />;
    case "gem":
      return <GemShape material={material} />;
    case "initial":
      return <InitialShape material={material} text={text} />;
    case "custom":
      return <CustomShape material={material} assetUrl={customAssetUrl} />;
    case "part":
      return partImageUrl ? <PartImageShape imageUrl={partImageUrl} /> : <GemShape material={material} />;
    default:
      return null;
  }
}
