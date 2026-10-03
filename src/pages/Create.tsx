import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { CharmBriefForm } from "../components/charmStudio/CharmBriefForm";
import { ConceptOptionCard } from "../components/charmStudio/ConceptOptionCard";
import { RefineStep } from "../components/charmStudio/RefineStep";
import { useDesign } from "../context/DesignContext";
import { useCharmDesign } from "../context/CharmDesignContext";
import { generateCharmConcept } from "../services/charmAi";
import { trackEvent } from "../services/analytics";
import type { CharmBriefInput, CharmConcept } from "../types/charmStudio";

const MAX_CONCEPTS = 3;

function defaultBrief(): CharmBriefInput {
  return {
    theme: "original",
    style: "minimal",
    representation: "flat_silhouette",
    finishColor: "silver",
    sizePresetId: "size-review",
    description: "",
  };
}

type Step = "brief" | "concepts" | "refine";

export function Create() {
  const navigate = useNavigate();
  const { addCharm } = useDesign();
  const { design, startDesignFromConcept } = useCharmDesign();

  const [step, setStep] = useState<Step>(design ? "refine" : "brief");
  const [brief, setBrief] = useState<CharmBriefInput>(design?.brief ?? defaultBrief());
  const [concepts, setConcepts] = useState<CharmConcept[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);

  const handleGenerateConcepts = async () => {
    if (isGeneratingConcepts) return;
    setIsGeneratingConcepts(true);
    trackEvent("create_started", { theme: brief.theme, hasPhoto: Boolean(brief.sourceImage) });
    const concept = await generateCharmConcept(brief, 0);
    setConcepts([concept]);
    setStep("concepts");
    setIsGeneratingConcepts(false);
  };

  const handleGenerateAnother = async () => {
    if (isGeneratingConcepts || concepts.length >= MAX_CONCEPTS) return;
    setIsGeneratingConcepts(true);
    const concept = await generateCharmConcept(brief, concepts.length);
    setConcepts((prev) => [...prev, concept]);
    setIsGeneratingConcepts(false);
  };

  const handleChoose = (concept: CharmConcept) => {
    startDesignFromConcept(brief, concept);
    trackEvent("concept_selected", { isDemo: concept.isDemo });
    setStep("refine");
  };

  const handlePreviewOnHoop = () => {
    const current = design?.versions.find((v) => v.id === design.currentVersionId)?.concept;
    if (current?.imageUrl) {
      addCharm("custom", { customAssetUrl: current.imageUrl });
    }
    navigate("/studio");
  };

  return (
    <Container className="py-10 pb-24 sm:py-16">
      {step === "brief" && (
        <>
          <div className="mb-10 max-w-xl">
            <h1 className="text-3xl font-medium text-graphite sm:text-4xl">
              Create a charm that means something to you.
            </h1>
            <p className="mt-3 text-graphite-soft">Start with a photo, a memory, or an idea.</p>
          </div>
          <div className="max-w-2xl">
            <CharmBriefForm value={brief} onChange={setBrief} onSubmit={handleGenerateConcepts} />
          </div>
        </>
      )}

      {isGeneratingConcepts && concepts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-graphite-soft">
          <Loader2 className="animate-spin" size={28} />
          <p>Turning your idea into charm concepts...</p>
        </div>
      )}

      {step === "concepts" && concepts.length > 0 && (
        <>
          <div className="mb-10 max-w-xl">
            <h1 className="text-3xl font-medium text-graphite sm:text-4xl">Here's what we imagined.</h1>
            <p className="mt-3 text-graphite-soft">Choose one — you can refine it in the next step.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {concepts.map((c) => (
              <ConceptOptionCard key={c.id} concept={c} onChoose={() => handleChoose(c)} />
            ))}
            {concepts.length < MAX_CONCEPTS && (
              <button
                type="button"
                onClick={handleGenerateAnother}
                disabled={isGeneratingConcepts}
                className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-graphite/20 text-graphite-soft hover:border-champagne disabled:opacity-50"
              >
                {isGeneratingConcepts ? <Loader2 className="animate-spin" size={22} /> : <Plus size={22} />}
                <span className="text-sm">Generate another option</span>
              </button>
            )}
          </div>
        </>
      )}

      {step === "refine" && design && (
        <>
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-medium text-graphite sm:text-3xl">Refine your charm.</h1>
            <Button size="sm" variant="outline" onClick={() => navigate("/charm/request")}>
              Request Production Review
            </Button>
          </div>
          <RefineStep onContinue={handlePreviewOnHoop} />
        </>
      )}
    </Container>
  );
}
