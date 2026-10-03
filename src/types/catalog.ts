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
  connectionPoints?: { id: string; x: number; y: number }[];
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
