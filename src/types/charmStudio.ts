import type { MaterialType } from "./jewelry";

/**
 * "Create Your Charm" data model — a focused flow that generates ONE charm
 * concept (not a full jewelry piece), tracks its edit history as versions, and
 * routes to a production review request rather than instant checkout.
 *
 * Two layers are kept deliberately separate (see spec §5):
 *  - what the generated IMAGE shows (`loop`/`connector` here) — a depiction only.
 *  - what manufacturing has actually confirmed (`ManufacturingProfile`) — real
 *    specs, populated by an operator, never inferred from a photo.
 * A concept is never auto-approved just because the picture looks right.
 */

export type ReviewFlagStatus = "needs_review" | "operator_confirmed";

export type LoopSpec = {
  /** Whether the generation prompt asked for a top loop — a request, not a visual confirmation. */
  requested: boolean;
  position: "top_center";
  reviewStatus: ReviewFlagStatus;
};

export type ConnectorSpec = {
  type: "jump_ring" | "bail" | "unspecified";
  reviewStatus: ReviewFlagStatus;
};

/**
 * Operator-managed manufacturing constraints. Every field is optional and
 * starts unset — `needsReviewFields` lists exactly which ones are still
 * unconfirmed so the UI never silently treats a blank as a real spec.
 */
export type ManufacturingProfile = {
  loopInnerDiameterMm?: number;
  loopWireThicknessMm?: number;
  connectorDimensionsMm?: string;
  hoopPassthroughNote?: string;
  minBodyWidthMm?: number;
  minBodyHeightMm?: number;
  minBodyThicknessMm?: number;
  maxWeightG?: number;
  sizePresets?: { id: string; label: string }[];
};

export type RepresentationMode = "flat_silhouette" | "engraved_plate" | "relief_concept";
export type CharmTheme = "pet" | "initial" | "memory" | "symbol" | "original";
export type CharmStyle = "minimal" | "cute" | "elegant";

export type CharmBriefInput = {
  theme: CharmTheme;
  style: CharmStyle;
  representation: RepresentationMode;
  finishColor: MaterialType;
  sizePresetId?: string;
  initialText?: string;
  description: string;
  sourceImage?: string;
};

export type CharmConcept = {
  id: string;
  name: string;
  designIntent: string;
  imageUrl: string;
  connectionDescription: string;
  needsReview: string[];
  loop: LoopSpec;
  connector: ConnectorSpec;
  imageModel: string;
  analysisModel: string | null;
  isDemo: boolean;
};

export type GenerationJobStatus = "queued" | "running" | "succeeded" | "failed";

export type CharmDesignVersion = {
  id: string;
  parentVersionId?: string;
  concept?: CharmConcept;
  editRequestText?: string;
  status: GenerationJobStatus;
  errorMessage?: string;
  createdAt: string;
};

export type CharmDesign = {
  id: string;
  brief: CharmBriefInput;
  versions: CharmDesignVersion[];
  currentVersionId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductionReviewStatus =
  | "submitted"
  | "in_review"
  | "quoted"
  | "approved_by_customer"
  | "declined";

export type ProductionReviewRequest = {
  id: string;
  charmDesignId: string;
  versionId: string;
  desiredSizeId?: string;
  materialRequest: MaterialType;
  finishRequest: MaterialType;
  connectionSummary: string;
  engravingText?: string;
  standaloneOrOnHoop: "charm_only" | "with_hoop";
  quantity: number;
  pairOrSingle?: "single" | "pair";
  contactName: string;
  contactEmail: string;
  note?: string;
  status: ProductionReviewStatus;
  submittedAt: string;
};
