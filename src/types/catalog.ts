/**
 * Real-parts catalog + the wider commerce data model from the vandida/Monomy/Jewelise
 * spec. `Part` is fully wired into the Studio today. Everything below it
 * (BaseProduct, DesignComponent, QuoteRequest, Order, InterestRegistration,
 * PreorderCampaign) is type-level scaffolding only — defined so the shape of the
 * data is settled, but not yet backed by a screen or storage adapter. Wiring
 * them up is listed as remaining work rather than implemented partially.
 */

export type PartCategory = "base" | "connecting" | "charm" | "decoration" | "unclassified";

/**
 * How this record's `category` was decided — never a stand-in for manufacturing
 * sign-off. `manually_reviewed` means a person looked at the photo and judged
 * its category; `heuristic_unverified` means only an automated pixel-shape rule
 * did. Neither implies the part is confirmed compatible with anything.
 */
export type ReviewStatus = "manually_reviewed" | "heuristic_unverified" | "operator_confirmed";

/** A point on a part's image, normalized 0–1 against the part's FULL original canvas (not the cropped display). */
export type NormalizedPoint = { x: number; y: number };

export type ChildAttachmentPoint = {
  id: string;
  point: NormalizedPoint;
  /** Which part categories may hang from this point. Empty/undefined = not yet decided, nothing should auto-attach here. */
  acceptsCategories?: PartCategory[];
};

export type AttachmentReviewStatus = "unset" | "manually_set";

/**
 * Where/how this part hangs and what can hang from it — kept separate from
 * `category`'s ReviewStatus because "what kind of thing is this" and "exactly
 * where does it connect" are confirmed by different means (a shape heuristic
 * vs. a person clicking the image). `manually_set` here is the ONLY status
 * the swing physics / snap-to-point editor will treat as a real connection —
 * never inferred from the photo or from an AI image showing a loop.
 */
export type PartAttachment = {
  /** Where THIS part hangs from its parent — absent for base findings, which don't hang from anything. */
  attachmentPoint?: NormalizedPoint;
  childAttachmentPoints?: ChildAttachmentPoint[];
  /** Multiplier applied on top of the part's natural pixel size when displayed. */
  displayScale?: number;
  /** Resting rotation in degrees when the part hangs still, 0 = attachmentPoint directly above visual center. */
  restAngle?: number;
  reviewStatus: AttachmentReviewStatus;
};

export type Part = {
  id: string;
  sku: string;
  name: string;
  category: PartCategory;
  imageUrl: string;
  /** Original filename from the supplied archive — keeps every catalog id traceable back to its source photo. */
  sourceFile: string;
  reviewStatus: ReviewStatus;

  /** Measured from the photo's own alpha channel. Pixel geometry, not a real-world measurement. */
  canvasPixelWidth: number | null;
  canvasPixelHeight: number | null;
  visualFootprintPx: { width: number; height: number } | null;
  /** Same alpha-channel bounding box as visualFootprintPx, normalized 0–1 against the full canvas — origin AND size, so attachment points can be transformed when the display crops to this box. */
  visualBounds: { x: number; y: number; width: number; height: number } | null;

  /** Present only for the small set of parts an operator (or the dev attachment-point editor) has actually set up for the combo/physics preview. Absent = this part can still be browsed/added to a flat-list design, but can't be hung with real swing physics yet. */
  attachment?: PartAttachment;

  // Everything below is intentionally left undefined until an operator confirms
  // it — never inferred from the photo alone.
  realSize?: { width: number; height: number; unit: "mm" | "cm" };
  material?: string;
  finish?: string;
  unitCost?: number;
  retailPrice?: number;
  stock?: number | "in_stock" | "out_of_stock";
  /** Base ids this part is confirmed to physically attach to. Empty = not yet confirmed for any base. */
  compatibleBaseIds?: string[];
  maxQuantity?: number;
  weight?: number;
};

// ---------------------------------------------------------------------------
// Scaffolding below — types only, not yet wired to a screen or storage adapter.
// ---------------------------------------------------------------------------

/** A sellable base/finding (hoop size, pendant base, …). Distinct from the raw photographed `Part` catalog. */
export type BaseProduct = {
  id: string;
  name: string;
  productType: "hoop-earring" | "pendant";
  referencePartId?: string;
  retailPrice?: number;
  stock?: number | "in_stock" | "out_of_stock";
};

/** One part placed on a design, versioned independently of the live `Part` record so past orders never silently reprice. */
export type DesignComponent = {
  id: string;
  partId: string;
  partSnapshot: Pick<Part, "id" | "name" | "imageUrl" | "retailPrice">;
  quantity: number;
  connectionOrder: number;
};

export type QuoteRequestStatus = "submitted" | "in_review" | "quoted" | "declined";

export type QuoteRequest = {
  id: string;
  designId: string;
  reason: "custom_ai_design" | "unconfirmed_parts" | "manual_request";
  status: QuoteRequestStatus;
  contactName: string;
  contactEmail: string;
  note?: string;
  submittedAt: string;
};

export type OrderStatus = "demo_submitted" | "confirmed" | "in_production" | "shipped" | "cancelled";

export type Order = {
  id: string;
  designId: string;
  status: OrderStatus;
  /** Every order freezes its own price — editing catalog prices later must never change past orders. */
  priceSnapshot: number;
  isDemoOrder: true;
  createdAt: string;
};

export type InterestRegistration = {
  id: string;
  designId?: string;
  campaignId?: string;
  email: string;
  createdAt: string;
};

export type PreorderCampaign = {
  id: string;
  designId: string;
  targetPaidOrders: number;
  currentPaidOrders: number;
  interestRegistrationCount: number;
  endsAt: string;
  isDemo: true;
};
