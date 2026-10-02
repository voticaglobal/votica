import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { BottomSheet } from "../components/common/BottomSheet";
import { FieldGroup, Input, Textarea } from "../components/common/Field";
import { HoopPreview } from "../components/studio/HoopPreview";
import { useDesign } from "../context/DesignContext";
import { calculateEstimatedPrice, estimateProductionWindow } from "../services/pricing";
import { trackEvent } from "../services/analytics";
import { appendToList, StorageKeys } from "../services/storage";
import { formatCurrency, generateId } from "../lib/utils";
import { MATERIAL_LABELS } from "../lib/labels";
import type { ProductionRequest } from "../types/jewelry";

export function DesignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { findDesignById } = useDesign();
  const design = id ? findDesignById(id) : undefined;

  const [makeMineOpen, setMakeMineOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", country: "", note: "" });

  if (!design) {
    return (
      <Container className="py-24 text-center">
        <p className="text-graphite-soft">We couldn't find that design.</p>
        <Button className="mt-6" onClick={() => navigate("/create")}>
          Start a new design
        </Button>
      </Container>
    );
  }

  const price = calculateEstimatedPrice(design);

  const handleSubmitProductionRequest = () => {
    const request: ProductionRequest = {
      id: generateId("request"),
      designId: design.id,
      name: form.name,
      email: form.email,
      country: form.country,
      note: form.note,
      submittedAt: new Date().toISOString(),
    };
    appendToList(StorageKeys.productionRequests, request, 50);
    trackEvent("production_request_submitted", { designId: design.id });
    setSubmitted(true);
  };

  const handleSell = () => {
    trackEvent("sell_design_clicked", { designId: design.id });
    navigate(`/creator/onboarding?designId=${design.id}`);
  };

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <div className="grid gap-10 sm:grid-cols-2">
        <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-stone p-8">
          <HoopPreview design={design} />
        </div>

        <div>
          <h1 className="font-serif text-3xl text-graphite">{design.name}</h1>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-graphite/8 pb-3">
              <dt className="text-graphite-soft">Material</dt>
              <dd className="font-medium text-graphite">{MATERIAL_LABELS[design.material]}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/8 pb-3">
              <dt className="text-graphite-soft">Charms</dt>
              <dd className="font-medium text-graphite">{design.charms.length}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/8 pb-3">
              <dt className="text-graphite-soft">Estimated Price</dt>
              <dd className="font-medium text-graphite">{formatCurrency(price)}</dd>
            </div>
            <div className="flex justify-between pb-3">
              <dt className="text-graphite-soft">Estimated Production</dt>
              <dd className="font-medium text-graphite">{estimateProductionWindow()}</dd>
            </div>
          </dl>

          <p className="mt-6 text-sm leading-relaxed text-graphite-soft">
            Your final design will be reviewed for manufacturability before production.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                trackEvent("make_mine_clicked", { designId: design.id });
                setMakeMineOpen(true);
              }}
            >
              Wear Mine
            </Button>
            <Button size="lg" variant="outline" className="flex-1" onClick={handleSell}>
              Sell This Design
            </Button>
          </div>
        </div>
      </div>

      <BottomSheet
        open={makeMineOpen}
        onClose={() => {
          setMakeMineOpen(false);
          setSubmitted(false);
        }}
        title={submitted ? "Request received" : "Your design is almost ready."}
      >
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-graphite-soft">
              Thank you — we'll follow up by email once your production model is ready for final
              confirmation.
            </p>
            <Button className="w-full" onClick={() => setMakeMineOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <ol className="space-y-2 text-sm text-graphite-soft">
              <li>1. vandida reviews your design.</li>
              <li>2. We prepare the production model.</li>
              <li>3. You receive final confirmation before production.</li>
            </ol>

            <FieldGroup label="Name" htmlFor="mm-name">
              <Input
                id="mm-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup label="Email" htmlFor="mm-email">
              <Input
                id="mm-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup label="Country" htmlFor="mm-country">
              <Input
                id="mm-country"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup label="Note (optional)" htmlFor="mm-note">
              <Textarea
                id="mm-note"
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </FieldGroup>

            <Button
              className="w-full"
              disabled={!form.name || !form.email || !form.country}
              onClick={handleSubmitProductionRequest}
            >
              Request Production
            </Button>
          </div>
        )}
      </BottomSheet>
    </Container>
  );
}
