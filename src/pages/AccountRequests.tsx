import { useState } from "react";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { DemoNotice } from "../components/common/DemoNotice";
import { getCharmDesignById } from "../services/charmDesignStore";
import {
  listProductionRequests,
  getLatestQuote,
  checkQuoteValidity,
  recordCustomerDecision,
  totalForQuote,
  QUOTE_STATUS_LABEL,
} from "../services/reviewStore";
import { formatCurrency } from "../lib/utils";
import { cn } from "../lib/utils";
import type { ProductionReviewRequest } from "../types/charmStudio";

const STATUS_COPY: Record<ProductionReviewRequest["status"], string> = {
  submitted: "Submitted — awaiting review.",
  needs_changes: "Changes requested.",
  approved: "Approved for production.",
  rejected: "Not manufacturable as designed.",
};

export function AccountRequests() {
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);
  const requests = listProductionRequests();

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <h1 className="font-serif text-2xl text-graphite">Your Requests</h1>
      <p className="mt-1 text-sm text-graphite-soft">
        This browser's local requests. Cross-device sync needs the Supabase backend connected — see
        the session report.
      </p>
      <DemoNotice className="mt-4">
        Preview build. Nothing below was sent to a real production team, and approving a quote does
        not trigger payment or production — see each request's status for what's demo vs. real.
      </DemoNotice>

      <div className="mt-8 space-y-6">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} onChange={refresh} />
        ))}
        {requests.length === 0 && <p className="text-graphite-soft">No requests yet.</p>}
      </div>
    </Container>
  );
}

function RequestCard({ request, onChange }: { request: ProductionReviewRequest; onChange: () => void }) {
  const design = getCharmDesignById(request.charmDesignId);
  const concept = design?.versions.find((v) => v.id === request.versionId)?.concept;
  const quote = getLatestQuote(request.id);
  const validity = quote ? checkQuoteValidity(quote, request) : null;

  const decide = (decision: "accepted" | "declined") => {
    if (!quote) return;
    const result = recordCustomerDecision(quote.id, request.id, decision);
    if (!result.ok) {
      window.alert(result.reason);
    }
    onChange();
  };

  return (
    <div className="flex gap-5 rounded-3xl border border-graphite/10 p-5">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone">
        {concept?.imageUrl && <img src={concept.imageUrl} alt={concept.name} className="h-full w-full object-contain" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-graphite">{concept?.name ?? "Charm design"}</h3>
          <span className="text-xs text-graphite-soft">{new Date(request.submittedAt).toLocaleDateString()}</span>
        </div>
        <p className="mt-1 text-sm text-graphite-soft">{STATUS_COPY[request.status]}</p>
        {request.customerMessage && (
          <p className="mt-2 rounded-xl bg-stone px-3 py-2 text-sm text-graphite">{request.customerMessage}</p>
        )}

        {quote && (
          <div className="mt-3 rounded-xl border border-graphite/10 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-graphite">Quote</span>
              <span className={cn("text-xs", quote.status === "sent" ? "text-amber-600" : "text-graphite-soft")}>
                {QUOTE_STATUS_LABEL[quote.status]}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-graphite-soft">
              {quote.lineItems.map((li) => (
                <li key={li.id} className="flex justify-between">
                  <span>{li.label}</span>
                  <span>{formatCurrency(li.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-graphite/10 pt-2 text-sm font-medium text-graphite">
              <span>Total</span>
              <span>{formatCurrency(totalForQuote(quote))}</span>
            </div>
            <p className="mt-1 text-[11px] text-graphite-soft">
              Est. schedule: {quote.estimatedScheduleText} · Valid until {new Date(quote.validUntil).toLocaleDateString()}
            </p>

            {quote.status === "sent" && validity?.valid && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => decide("accepted")}>
                  Approve Quote
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide("declined")}>
                  Decline
                </Button>
              </div>
            )}
            {quote.status === "sent" && validity && !validity.valid && (
              <p className="mt-2 text-xs text-red-600">{validity.reason}</p>
            )}
            {quote.status === "accepted" && (
              <p className="mt-2 text-xs text-emerald-700">
                Approved — payment is not yet connected in this MVP. Our team will follow up to collect
                payment before production starts.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
