import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getItem, setItem, StorageKeys } from "../services/storage";
import { upsertCharmDesign } from "../services/charmDesignStore";
import { editCharmConcept } from "../services/charmAi";
import { generateId } from "../lib/utils";
import type { CharmBriefInput, CharmConcept, CharmDesign, CharmDesignVersion } from "../types/charmStudio";

type CharmDesignContextValue = {
  design: CharmDesign | null;
  isGenerating: boolean;
  /** Turns a picked concept option into the design-in-progress, as version 1. */
  startDesignFromConcept: (brief: CharmBriefInput, concept: CharmConcept) => CharmDesign;
  /** Requests an AI edit of the current version's image, saved as a new version on success. */
  requestEdit: (editRequestText: string) => Promise<{ ok: boolean; message?: string }>;
  restoreVersion: (versionId: string) => void;
  resetDesign: () => void;
};

const CharmDesignContext = createContext<CharmDesignContextValue | null>(null);

export function CharmDesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<CharmDesign | null>(() =>
    getItem<CharmDesign | null>(StorageKeys.currentCharmDesign, null),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const persist = useCallback((next: CharmDesign | null) => {
    setDesign(next);
    setItem(StorageKeys.currentCharmDesign, next);
    if (next) upsertCharmDesign(next);
  }, []);

  const startDesignFromConcept = useCallback(
    (brief: CharmBriefInput, concept: CharmConcept): CharmDesign => {
      const now = new Date().toISOString();
      const version: CharmDesignVersion = {
        id: generateId("version"),
        concept,
        status: "succeeded",
        createdAt: now,
      };
      const next: CharmDesign = {
        id: generateId("charm-design"),
        brief,
        versions: [version],
        currentVersionId: version.id,
        createdAt: now,
        updatedAt: now,
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const requestEdit = useCallback(
    async (editRequestText: string): Promise<{ ok: boolean; message?: string }> => {
      if (!design) return { ok: false, message: "No design in progress." };
      if (isGenerating) return { ok: false, message: "Already working on a version — one at a time." };

      const currentVersion = design.versions.find((v) => v.id === design.currentVersionId);
      const previousImage = currentVersion?.concept?.imageUrl;

      const pendingVersion: CharmDesignVersion = {
        id: generateId("version"),
        parentVersionId: design.currentVersionId,
        editRequestText,
        status: "running",
        createdAt: new Date().toISOString(),
      };
      // Append the pending version immediately but keep `currentVersionId` on the
      // old (known-good) version until generation actually succeeds — a failed
      // request must never leave the design pointing at nothing.
      persist({ ...design, versions: [...design.versions, pendingVersion], updatedAt: new Date().toISOString() });

      setIsGenerating(true);
      try {
        const result = await editCharmConcept(previousImage ?? "", editRequestText);

        if (result.kind === "error" || result.kind === "preview_locked") {
          const errorMessage = result.kind === "preview_locked" ? "Preview access required." : result.message;
          setDesign((prev) => {
            if (!prev) return prev;
            const failed: CharmDesignVersion = { ...pendingVersion, status: "failed", errorMessage };
            const next: CharmDesign = {
              ...prev,
              versions: prev.versions.map((v) => (v.id === pendingVersion.id ? failed : v)),
              // currentVersionId intentionally left pointing at the last good version.
              updatedAt: new Date().toISOString(),
            };
            setItem(StorageKeys.currentCharmDesign, next);
            upsertCharmDesign(next);
            return next;
          });
          if (result.kind === "preview_locked") return { ok: false, message: "preview_locked" };
          return { ok: false, message: result.retryable ? `${result.message} You can try again.` : result.message };
        }

        setDesign((prev) => {
          if (!prev) return prev;
          const settled: CharmDesignVersion = { ...pendingVersion, status: "succeeded", concept: result.concept };
          const next: CharmDesign = {
            ...prev,
            versions: prev.versions.map((v) => (v.id === pendingVersion.id ? settled : v)),
            currentVersionId: settled.id,
            updatedAt: new Date().toISOString(),
          };
          setItem(StorageKeys.currentCharmDesign, next);
          upsertCharmDesign(next);
          return next;
        });
        return { ok: true };
      } catch (err) {
        setDesign((prev) => {
          if (!prev) return prev;
          const failed: CharmDesignVersion = {
            ...pendingVersion,
            status: "failed",
            errorMessage: err instanceof Error ? err.message : "Generation failed.",
          };
          const next: CharmDesign = {
            ...prev,
            versions: prev.versions.map((v) => (v.id === pendingVersion.id ? failed : v)),
            // currentVersionId intentionally left pointing at the last good version.
            updatedAt: new Date().toISOString(),
          };
          setItem(StorageKeys.currentCharmDesign, next);
          upsertCharmDesign(next);
          return next;
        });
        return { ok: false, message: "That edit didn't go through — your previous version is still there." };
      } finally {
        setIsGenerating(false);
      }
    },
    [design, isGenerating, persist],
  );

  const restoreVersion = useCallback(
    (versionId: string) => {
      if (!design) return;
      const target = design.versions.find((v) => v.id === versionId && v.status === "succeeded");
      if (!target) return;
      persist({ ...design, currentVersionId: target.id, updatedAt: new Date().toISOString() });
    },
    [design, persist],
  );

  const resetDesign = useCallback(() => persist(null), [persist]);

  const value = useMemo<CharmDesignContextValue>(
    () => ({ design, isGenerating, startDesignFromConcept, requestEdit, restoreVersion, resetDesign }),
    [design, isGenerating, startDesignFromConcept, requestEdit, restoreVersion, resetDesign],
  );

  return <CharmDesignContext.Provider value={value}>{children}</CharmDesignContext.Provider>;
}

export function useCharmDesign(): CharmDesignContextValue {
  const ctx = useContext(CharmDesignContext);
  if (!ctx) throw new Error("useCharmDesign must be used within CharmDesignProvider");
  return ctx;
}
