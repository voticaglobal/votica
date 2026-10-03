import { getItem, setItem, StorageKeys } from "./storage";
import { generateId } from "../lib/utils";
import type { ProductionReviewRequest, Quote, QuoteLineItem, QuoteStatus } from "../types/charmStudio";

/**
 * Local demo repository for production requests + quotes. Mirrors the shape
 * of supabase/schema.sql's production_requests/quotes/quote_items tables so a
 * real adapter can replace this module's internals without changing callers.
 *
 * NOT real multi-user storage — this is per-browser localStorage. "Duplicate
 * request" and "stale quote" checks below are real logic, but they only see
 * this one browser's data; a different device/browser has its own copy until
 * Supabase is connected (see services/supabaseAdapter.ts).
 */

const OPEN_REQUEST_STATUSES = new Set<ProductionReviewRequest["status"]>(["submitted", "needs_changes"]);

export function listProductionRequests(): ProductionReviewRequest[] {
  return getItem<ProductionReviewRequest[]>(StorageKeys.productionReviewRequests, []);
}

export function getProductionRequest(id: string): ProductionReviewRequest | undefined {
  return listProductionRequests().find((r) => r.id === id);
}

function saveAllRequests(requests: ProductionReviewRequest[]) {
  setItem(StorageKeys.productionReviewRequests, requests);
}

export type SubmitRequestInput = Omit<
  ProductionReviewRequest,
  "id" | "status" | "submittedAt" | "updatedAt" | "loopConfirmedByOperator" | "internalNotes" | "customerMessage"
>;

export type SubmitRequestResult =
  | { ok: true; request: ProductionReviewRequest }
  | { ok: false; reason: "duplicate"; existing: ProductionReviewRequest };

/** Server-side-equivalent duplicate guard: one open request per exact design version, checked before insert. */
export function submitProductionRequest(input: SubmitRequestInput): SubmitRequestResult {
  const existing = listProductionRequests().find(
    (r) => r.charmDesignId === input.charmDesignId && r.versionId === input.versionId && OPEN_REQUEST_STATUSES.has(r.status),
  );
  if (existing) return { ok: false, reason: "duplicate", existing };

  const now = new Date().toISOString();
  const request: ProductionReviewRequest = {
    ...input,
    id: generateId("review"),
    status: "submitted",
    loopConfirmedByOperator: false,
    submittedAt: now,
    updatedAt: now,
  };
  saveAllRequests([request, ...listProductionRequests()]);
  return { ok: true, request };
}

export type AdminRequestAction =
  | { type: "request_changes"; customerMessage: string; internalNotes?: string }
  | { type: "approve"; internalNotes?: string }
  | { type: "reject"; customerMessage: string; internalNotes?: string }
  | { type: "confirm_loop"; confirmed: boolean };

export function applyAdminRequestAction(requestId: string, action: AdminRequestAction): ProductionReviewRequest | null {
  const requests = listProductionRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const current = requests[idx];
  const updated: ProductionReviewRequest = { ...current, updatedAt: new Date().toISOString() };

  if (action.type === "request_changes") {
    updated.status = "needs_changes";
    updated.customerMessage = action.customerMessage;
    if (action.internalNotes) updated.internalNotes = action.internalNotes;
  } else if (action.type === "approve") {
    updated.status = "approved";
    if (action.internalNotes) updated.internalNotes = action.internalNotes;
  } else if (action.type === "reject") {
    updated.status = "rejected";
    updated.customerMessage = action.customerMessage;
    if (action.internalNotes) updated.internalNotes = action.internalNotes;
  } else if (action.type === "confirm_loop") {
    updated.loopConfirmedByOperator = action.confirmed;
  }

  requests[idx] = updated;
  saveAllRequests(requests);
  return updated;
}

// --- Quotes ---

export function listQuotes(): Quote[] {
  return getItem<Quote[]>(StorageKeys.quotes, []);
}

function saveAllQuotes(quotes: Quote[]) {
  setItem(StorageKeys.quotes, quotes);
}

export function listQuotesForRequest(requestId: string): Quote[] {
  return listQuotes()
    .filter((q) => q.productionRequestId === requestId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The one quote a customer should see/act on: the latest, not superseded. */
export function getLatestQuote(requestId: string): Quote | undefined {
  return listQuotesForRequest(requestId)[0];
}

export type CreateQuoteInput = {
  productionRequestId: string;
  charmDesignVersionId: string;
  lineItems: Omit<QuoteLineItem, "id">[];
  currency: string;
  includesHoop: boolean;
  estimatedScheduleText: string;
  validUntil: string;
};

/** Creating a new quote for a request that already has one supersedes the old one (old becomes unapprovable). */
export function createOrReviseQuote(input: CreateQuoteInput): Quote {
  const previous = getLatestQuote(input.productionRequestId);
  const now = new Date().toISOString();

  const quote: Quote = {
    id: generateId("quote"),
    productionRequestId: input.productionRequestId,
    charmDesignVersionId: input.charmDesignVersionId,
    supersedesQuoteId: previous?.id,
    status: "sent",
    lineItems: input.lineItems.map((li) => ({ ...li, id: generateId("item") })),
    currency: input.currency,
    includesHoop: input.includesHoop,
    estimatedScheduleText: input.estimatedScheduleText,
    validUntil: input.validUntil,
    createdAt: now,
    sentAt: now,
  };

  const quotes = listQuotes();
  if (previous && previous.status === "sent") {
    const idx = quotes.findIndex((q) => q.id === previous.id);
    if (idx !== -1) quotes[idx] = { ...previous, status: "expired" };
  }
  saveAllQuotes([quote, ...quotes]);
  return quote;
}

export type QuoteValidity = { valid: true } | { valid: false; reason: string };

/** A quote is approvable only if it's the latest, still "sent", not expired by date, and still matches the request's current design version. */
export function checkQuoteValidity(quote: Quote, request: ProductionReviewRequest): QuoteValidity {
  const latest = getLatestQuote(request.id);
  if (!latest || latest.id !== quote.id) return { valid: false, reason: "A newer quote has replaced this one." };
  if (quote.status !== "sent") return { valid: false, reason: `This quote is ${quote.status}, not awaiting a decision.` };
  if (new Date(quote.validUntil).getTime() < Date.now()) return { valid: false, reason: "This quote has expired." };
  if (quote.charmDesignVersionId !== request.versionId) {
    return { valid: false, reason: "The design has changed since this quote was sent." };
  }
  return { valid: true };
}

export function recordCustomerDecision(
  quoteId: string,
  requestId: string,
  decision: "accepted" | "declined",
): { ok: true; quote: Quote } | { ok: false; reason: string } {
  const quotes = listQuotes();
  const idx = quotes.findIndex((q) => q.id === quoteId);
  if (idx === -1) return { ok: false, reason: "Quote not found." };

  const request = getProductionRequest(requestId);
  if (!request) return { ok: false, reason: "Request not found." };

  const validity = checkQuoteValidity(quotes[idx], request);
  if (!validity.valid) return { ok: false, reason: validity.reason };

  // Snapshot the exact quote + request configuration at approval time — later
  // edits to either must never retroactively change what was approved.
  const decided: Quote = {
    ...quotes[idx],
    status: decision,
    customerDecisionAt: new Date().toISOString(),
  };
  quotes[idx] = decided;
  saveAllQuotes(quotes);
  return { ok: true, quote: decided };
}

export function totalForQuote(quote: Quote): number {
  return quote.lineItems.reduce((sum, item) => sum + item.amount, 0);
}

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Awaiting your decision",
  accepted: "Approved — payment pending",
  declined: "Declined",
  expired: "Expired / replaced",
};
