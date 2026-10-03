import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Chip } from "../components/common/Chip";
import { FieldGroup, Input, Textarea } from "../components/common/Field";
import { useCharmDesign } from "../context/CharmDesignContext";
import { DemoNotice } from "../components/common/DemoNotice";
import { getManufacturingProfile, getUnconfirmedSpecFields } from "../services/manufacturingProfile";
import { submitProductionRequest } from "../services/reviewStore";
import { trackEvent } from "../services/analytics";
import { MATERIAL_LABELS } from "../lib/labels";
import type { MaterialType } from "../types/jewelry";

export function CharmReviewRequest() {
  const navigate = useNavigate();
  const { design } = useCharmDesign();
  const sizePresets = getManufacturingProfile().sizePresets ?? [];
  const unconfirmedSpecs = getUnconfirmedSpecFields();

  const currentVersion = design?.versions.find((v) => v.id === design.currentVersionId);
  const concept = currentVersion?.concept;

  const [desiredSizeId, setDesiredSizeId] = useState(design?.brief.sizePresetId ?? sizePresets[0]?.id ?? "");
  const [materialRequest, setMaterialRequest] = useState<MaterialType>(design?.brief.finishColor ?? "silver");
  const [standaloneOrOnHoop, setStandaloneOrOnHoop] = useState<"charm_only" | "with_hoop">("with_hoop");
  const [pairOrSingle, setPairOrSingle] = useState<"single" | "pair">("pair");
  const [quantity, setQuantity] = useState(1);
  const [engravingText, setEngravingText] = useState(design?.brief.initialText ?? "");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState(false);

  if (!design || !concept) {
    return (
      <Container className="py-24 text-center">
        <p className="text-graphite-soft">Start a charm design first.</p>
        <Button className="mt-6" onClick={() => navigate("/create")}>
          Create Your Charm
        </Button>
      </Container>
    );
  }

  const handleSubmit = () => {
    const result = submitProductionRequest({
      charmDesignId: design.id,
      versionId: design.currentVersionId,
      desiredSizeId,
      materialRequest,
      finishRequest: materialRequest,
      connectionSummary: concept.connectionDescription,
      engravingText: engravingText || undefined,
      standaloneOrOnHoop,
      quantity,
      pairOrSingle: standaloneOrOnHoop === "with_hoop" ? pairOrSingle : undefined,
      contactName,
      contactEmail,
      note: note || undefined,
    });

    if (!result.ok) {
      setDuplicateNotice(true);
      return;
    }
    trackEvent("quote_requested", { charmDesignId: design.id });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-2xl text-graphite">Request saved (demo).</h1>
        <p className="mx-auto mt-3 max-w-md text-graphite-soft">
          In the real product, our team would review the connection point, sizing, and
          manufacturability, then send a quote to approve before production. In this preview,
          nothing was sent anywhere — try the demo admin review at{" "}
          <button type="button" className="underline" onClick={() => navigate("/admin/requests")}>
            /admin/requests
          </button>
          .
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button onClick={() => navigate("/account/requests")}>View Your Requests</Button>
          <button type="button" className="text-sm text-graphite-soft hover:underline" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-stone p-8">
            {concept.imageUrl ? (
              <img src={concept.imageUrl} alt={concept.name} className="w-full object-contain" />
            ) : (
              <p className="py-16 text-center text-sm text-graphite-soft">Demo concept — no image generated.</p>
            )}
          </div>
          <div className="mx-auto mt-4 max-w-sm rounded-2xl bg-stone/60 p-4 text-xs text-graphite-soft">
            <p className="font-medium text-graphite">Connection point</p>
            <p className="mt-1">{concept.connectionDescription}</p>
            {unconfirmedSpecs.length > 0 && (
              <p className="mt-2">Specs needing review: {unconfirmedSpecs.join(", ")}.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <h1 className="font-serif text-2xl text-graphite">Request Production Review</h1>
          <p className="text-sm text-graphite-soft">
            This isn't checkout — our team confirms manufacturability and sends a quote for you to
            approve before anything is produced.
          </p>
          <DemoNotice>
            Preview build: this request is saved only in this browser and is <strong>not</strong>{" "}
            delivered to a real production team. Please use a test name/email, not real personal
            information.
          </DemoNotice>

          <FieldGroup label="Size" htmlFor="size">
            <div className="flex flex-wrap gap-2">
              {sizePresets.map((s) => (
                <Chip key={s.id} active={desiredSizeId === s.id} onClick={() => setDesiredSizeId(s.id)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Material / finish" htmlFor="material">
            <div className="flex flex-wrap gap-2">
              {(["silver", "gold-vermeil", "rose-gold"] as MaterialType[]).map((m) => (
                <Chip key={m} active={materialRequest === m} onClick={() => setMaterialRequest(m)}>
                  {MATERIAL_LABELS[m]}
                </Chip>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Charm only, or mounted on a hoop?" htmlFor="mount">
            <div className="flex flex-wrap gap-2">
              <Chip active={standaloneOrOnHoop === "charm_only"} onClick={() => setStandaloneOrOnHoop("charm_only")}>
                Charm only
              </Chip>
              <Chip active={standaloneOrOnHoop === "with_hoop"} onClick={() => setStandaloneOrOnHoop("with_hoop")}>
                With hoop
              </Chip>
            </div>
          </FieldGroup>

          {standaloneOrOnHoop === "with_hoop" && (
            <FieldGroup label="Single or pair" htmlFor="pair">
              <div className="flex flex-wrap gap-2">
                <Chip active={pairOrSingle === "single"} onClick={() => setPairOrSingle("single")}>
                  Single
                </Chip>
                <Chip active={pairOrSingle === "pair"} onClick={() => setPairOrSingle("pair")}>
                  Pair
                </Chip>
              </div>
            </FieldGroup>
          )}

          <FieldGroup label="Quantity" htmlFor="qty">
            <Input
              id="qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </FieldGroup>

          <FieldGroup label="Engraving (optional)" htmlFor="engraving">
            <Input id="engraving" value={engravingText} onChange={(e) => setEngravingText(e.target.value)} />
          </FieldGroup>

          <FieldGroup label="Name" htmlFor="name">
            <Input id="name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Email" htmlFor="email">
            <Input id="email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Anything else? (optional)" htmlFor="note">
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </FieldGroup>

          <Button
            size="lg"
            className="w-full"
            disabled={!contactName || !contactEmail}
            onClick={handleSubmit}
          >
            Request Production Review
          </Button>
          {duplicateNotice && (
            <p className="text-xs text-graphite-soft">
              You already have an open review request for this exact design version.{" "}
              <button type="button" className="underline" onClick={() => navigate("/account/requests")}>
                View your requests
              </button>{" "}
              instead of submitting another.
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
