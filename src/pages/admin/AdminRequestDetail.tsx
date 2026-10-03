import { useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "../../components/common/Container";
import { Button } from "../../components/common/Button";
import { Textarea, Input, FieldGroup } from "../../components/common/Field";
import { AdminGate } from "../../components/admin/AdminGate";
import { getCharmDesignById } from "../../services/charmDesignStore";
import {
  getProductionRequest,
  applyAdminRequestAction,
  listQuotesForRequest,
  createOrReviseQuote,
  totalForQuote,
  QUOTE_STATUS_LABEL,
} from "../../services/reviewStore";
import { MATERIAL_LABELS } from "../../lib/labels";
import { formatCurrency } from "../../lib/utils";

function AdminRequestDetailInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);

  const request = id ? getProductionRequest(id) : undefined;
  const design = request ? getCharmDesignById(request.charmDesignId) : undefined;
  const version = design?.versions.find((v) => v.id === request?.versionId);
  const concept = version?.concept;
  const quotes = id ? listQuotesForRequest(id) : [];
  const latestQuote = quotes[0];

  const [internalNotes, setInternalNotes] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");

  const [sampleCost, setSampleCost] = useState("0");
  const [unitCost, setUnitCost] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [schedule, setSchedule] = useState("");
  const [validDays, setValidDays] = useState("14");

  if (!request) {
    return (
      <Container className="py-24 text-center">
        <p className="text-graphite-soft">Request not found.</p>
      </Container>
    );
  }

  const handleAction = (action: Parameters<typeof applyAdminRequestAction>[1]) => {
    applyAdminRequestAction(request.id, action);
    refresh();
  };

  const handleCreateQuote = () => {
    const n = (v: string) => Number(v) || 0;
    const validUntil = new Date(Date.now() + (Number(validDays) || 14) * 24 * 60 * 60 * 1000).toISOString();
    createOrReviseQuote({
      productionRequestId: request.id,
      charmDesignVersionId: request.versionId,
      currency,
      includesHoop: request.standaloneOrOnHoop === "with_hoop",
      estimatedScheduleText: schedule || "To be confirmed",
      validUntil,
      lineItems: [
        { label: "Sample / initial tooling", amount: n(sampleCost) },
        { label: `Unit price × ${request.quantity}`, amount: n(unitCost) * request.quantity },
        { label: "Shipping", amount: n(shippingCost) },
      ],
    });
    refresh();
  };

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <button type="button" className="mb-6 text-sm text-graphite-soft hover:underline" onClick={() => navigate("/admin/requests")}>
        ← All requests
      </button>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="rounded-3xl bg-stone p-8">
            {concept?.imageUrl ? (
              <img src={concept.imageUrl} alt={concept.name} className="w-full object-contain" />
            ) : (
              <p className="py-16 text-center text-sm text-graphite-soft">
                {concept ? "Demo concept — no image generated." : "Design version not found in this browser's archive."}
              </p>
            )}
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-graphite/8 py-2">
              <dt className="text-graphite-soft">Design</dt>
              <dd className="text-graphite">{concept?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/8 py-2">
              <dt className="text-graphite-soft">Design intent</dt>
              <dd className="max-w-[60%] text-right text-graphite">{concept?.designIntent ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/8 py-2">
              <dt className="text-graphite-soft">Connection (as depicted)</dt>
              <dd className="max-w-[60%] text-right text-graphite">{concept?.connectionDescription ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/8 py-2">
              <dt className="text-graphite-soft">Flagged for review</dt>
              <dd className="max-w-[60%] text-right text-graphite">{concept?.needsReview.join("; ") || "—"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-graphite-soft">Version history</dt>
              <dd className="text-graphite">{design?.versions.length ?? 0} version(s)</dd>
            </div>
          </dl>
        </div>

        <div>
          <h1 className="font-serif text-2xl text-graphite">Request from {request.contactName}</h1>
          <p className="text-sm text-graphite-soft">{request.contactEmail}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Field label="Size">{request.desiredSizeId ?? "—"}</Field>
            <Field label="Material">{MATERIAL_LABELS[request.materialRequest]}</Field>
            <Field label="Mount">{request.standaloneOrOnHoop === "with_hoop" ? `With hoop (${request.pairOrSingle})` : "Charm only"}</Field>
            <Field label="Quantity">{request.quantity}</Field>
            <Field label="Engraving">{request.engravingText || "—"}</Field>
            <Field label="Status">{request.status.replace("_", " ")}</Field>
          </dl>
          {request.note && <p className="mt-3 text-sm text-graphite-soft">Customer note: {request.note}</p>}

          <div className="mt-6 rounded-2xl border border-graphite/10 p-4">
            <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-graphite-soft">
              Loop / connector — manufacturing confirmation
              <span className={request.loopConfirmedByOperator ? "text-emerald-600" : "text-amber-600"}>
                {request.loopConfirmedByOperator ? "Confirmed" : "Not confirmed"}
              </span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleAction({ type: "confirm_loop", confirmed: true })}>
                Mark confirmed
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleAction({ type: "confirm_loop", confirmed: false })}>
                Mark unconfirmed
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <FieldGroup label="Internal notes (ops only — never shown to customer)" htmlFor="internal">
              <Textarea id="internal" rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Message to customer (shown as-is)" htmlFor="customer-msg">
              <Textarea id="customer-msg" rows={2} value={customerMessage} onChange={(e) => setCustomerMessage(e.target.value)} />
            </FieldGroup>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction({ type: "request_changes", customerMessage, internalNotes })}
              >
                Request Changes
              </Button>
              <Button size="sm" onClick={() => handleAction({ type: "approve", internalNotes })}>
                Approve for Production
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction({ type: "reject", customerMessage, internalNotes })}
              >
                Mark Not Manufacturable
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-graphite/10 p-5">
            <h2 className="font-serif text-lg text-graphite">
              {latestQuote ? "Revise Quote" : "Create Quote"}
            </h2>
            {latestQuote && (
              <p className="mb-3 text-xs text-graphite-soft">
                Current: {QUOTE_STATUS_LABEL[latestQuote.status]} — {formatCurrency(totalForQuote(latestQuote))}.
                Creating a new one supersedes it.
              </p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Sample/tooling" htmlFor="sample"><Input id="sample" type="number" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} /></FieldGroup>
              <FieldGroup label="Unit price" htmlFor="unit"><Input id="unit" type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></FieldGroup>
              <FieldGroup label="Shipping" htmlFor="ship"><Input id="ship" type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} /></FieldGroup>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <FieldGroup label="Estimated schedule" htmlFor="sched">
                <Input id="sched" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. 3-4 weeks after approval" />
              </FieldGroup>
              <FieldGroup label="Valid for (days)" htmlFor="valid">
                <Input id="valid" type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Currency" htmlFor="currency">
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-2xl border border-graphite/15 bg-white px-4 py-3 text-[15px] text-graphite focus:outline-none focus:ring-2 focus:ring-champagne/60"
                >
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                  <option value="EUR">EUR</option>
                </select>
              </FieldGroup>
            </div>
            <Button className="mt-4 w-full" onClick={handleCreateQuote}>
              {latestQuote ? "Send Revised Quote" : "Send Quote to Customer"}
            </Button>
          </div>

          {quotes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-soft">Quote history</p>
              <div className="space-y-2">
                {quotes.map((q) => (
                  <div key={q.id} className="flex justify-between rounded-xl bg-stone px-3 py-2 text-xs">
                    <span>{new Date(q.createdAt).toLocaleString()}</span>
                    <span>{QUOTE_STATUS_LABEL[q.status]}</span>
                    <span>{formatCurrency(totalForQuote(q))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-stone px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-graphite-soft">{label}</dt>
      <dd className="text-graphite">{children}</dd>
    </div>
  );
}

export function AdminRequestDetail() {
  return (
    <AdminGate>
      <AdminRequestDetailInner />
    </AdminGate>
  );
}
