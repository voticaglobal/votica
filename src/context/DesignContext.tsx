import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CharmInstance, CharmType, JewelryConcept, JewelryDesign, MaterialType } from "../types/jewelry";
import { HOOP_ATTACHMENT_POINTS, getFreeAttachmentPoints, getOccupiedAttachmentPointIds } from "../data/attachmentPoints";
import { canAddCharm, MAX_CHARM_SCALE, MIN_CHARM_SCALE } from "../services/manufacturing";
import { getItem, setItem, appendToList, StorageKeys } from "../services/storage";
import { DEMO_DESIGN, DEMO_DESIGNS } from "../data/demo";
import { generateId, clamp } from "../lib/utils";

type DesignContextValue = {
  currentDesign: JewelryDesign;
  recentDesigns: JewelryDesign[];
  loadDesign: (design: JewelryDesign) => void;
  createFromConcept: (concept: JewelryConcept, story: string, sourceImage?: string) => JewelryDesign;
  setMaterial: (material: MaterialType) => void;
  addCharm: (
    type: CharmType,
    options?: { text?: string; customAssetUrl?: string; partId?: string },
  ) => { ok: boolean; message?: string };
  setBaseReference: (partId: string | null) => void;
  duplicateCharm: (id: string) => { ok: boolean; message?: string };
  updateCharm: (id: string, patch: Partial<CharmInstance>) => void;
  moveCharm: (id: string, attachmentPointId: string) => void;
  nudgeCharm: (id: string, direction: -1 | 1) => void;
  deleteCharm: (id: string) => void;
  saveCurrentDesign: (name?: string) => JewelryDesign;
  findDesignById: (id: string) => JewelryDesign | undefined;
};

const DesignContext = createContext<DesignContextValue | null>(null);

function emptyDesignFor(productType: JewelryDesign["productType"] = "hoop-earring"): JewelryDesign {
  const now = new Date().toISOString();
  return {
    id: generateId("design"),
    name: "Untitled Design",
    productType,
    material: "silver",
    style: "minimal",
    gemstone: "none",
    charms: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [currentDesign, setCurrentDesign] = useState<JewelryDesign>(() =>
    getItem<JewelryDesign>(StorageKeys.currentDesign, DEMO_DESIGN),
  );
  const [recentDesigns, setRecentDesigns] = useState<JewelryDesign[]>(() =>
    getItem<JewelryDesign[]>(StorageKeys.recentDesigns, []),
  );

  useEffect(() => {
    setItem(StorageKeys.currentDesign, currentDesign);
  }, [currentDesign]);

  const loadDesign = useCallback((design: JewelryDesign) => {
    setCurrentDesign(design);
  }, []);

  const createFromConcept = useCallback((concept: JewelryConcept, story: string, sourceImage?: string) => {
    const now = new Date().toISOString();
    const charms: CharmInstance[] = concept.suggestedCharms.slice(0, 5).map((type, index) => ({
      id: generateId("charm"),
      type,
      attachmentPointId: HOOP_ATTACHMENT_POINTS[Math.floor((index + 1) * (HOOP_ATTACHMENT_POINTS.length / (concept.suggestedCharms.length + 1)))].id,
      scale: 1,
      rotation: 0,
      material: concept.material,
      text: type === "initial" ? "A" : undefined,
    }));

    const design: JewelryDesign = {
      id: generateId("design"),
      name: concept.name,
      productType: concept.productType,
      material: concept.material,
      style: "minimal",
      gemstone: "none",
      story,
      sourceImage,
      charms,
      createdAt: now,
      updatedAt: now,
    };

    setCurrentDesign(design);
    return design;
  }, []);

  const setMaterial = useCallback((material: MaterialType) => {
    setCurrentDesign((prev) => ({
      ...prev,
      material,
      charms: prev.charms.map((charm) => ({ ...charm, material })),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addCharm = useCallback(
    (
      type: CharmType,
      options?: { text?: string; customAssetUrl?: string; partId?: string },
    ): { ok: boolean; message?: string } => {
      let result: { ok: boolean; message?: string } = { ok: true };

      setCurrentDesign((prev) => {
        if (!canAddCharm(prev)) {
          result = { ok: false, message: "You've reached 5 charms — the most we can craft beautifully on one hoop." };
          return prev;
        }

        const openPoint = getFreeAttachmentPoints(prev.charms)[0] ?? HOOP_ATTACHMENT_POINTS[0];

        const newCharm: CharmInstance = {
          id: generateId("charm"),
          type,
          attachmentPointId: openPoint.id,
          // AI-generated charms carry an actual engraved image — give them extra
          // size by default so the artwork stays legible at hoop scale.
          scale: type === "custom" ? MAX_CHARM_SCALE : 1,
          rotation: 0,
          material: prev.material,
          text: type === "initial" ? options?.text || "A" : undefined,
          customAssetUrl: type === "custom" ? options?.customAssetUrl : undefined,
          partId: type === "part" ? options?.partId : undefined,
        };

        return { ...prev, charms: [...prev.charms, newCharm], updatedAt: new Date().toISOString() };
      });

      return result;
    },
    [],
  );

  const setBaseReference = useCallback((partId: string | null) => {
    setCurrentDesign((prev) => ({
      ...prev,
      baseReferencePartId: partId ?? undefined,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const duplicateCharm = useCallback((id: string): { ok: boolean; message?: string } => {
    let result: { ok: boolean; message?: string } = { ok: true };

    setCurrentDesign((prev) => {
      const source = prev.charms.find((c) => c.id === id);
      if (!source) return prev;

      if (!canAddCharm(prev)) {
        result = { ok: false, message: "You've reached 5 charms — the most we can craft beautifully on one hoop." };
        return prev;
      }

      const openPoint = getFreeAttachmentPoints(prev.charms)[0];
      if (!openPoint) {
        result = { ok: false, message: "Every spot is taken — remove a charm first to make room." };
        return prev;
      }

      const copy: CharmInstance = { ...source, id: generateId("charm"), attachmentPointId: openPoint.id };
      return { ...prev, charms: [...prev.charms, copy], updatedAt: new Date().toISOString() };
    });

    return result;
  }, []);

  const updateCharm = useCallback((id: string, patch: Partial<CharmInstance>) => {
    setCurrentDesign((prev) => ({
      ...prev,
      charms: prev.charms.map((charm) =>
        charm.id === id
          ? {
              ...charm,
              ...patch,
              scale: patch.scale !== undefined ? clamp(patch.scale, MIN_CHARM_SCALE, MAX_CHARM_SCALE) : charm.scale,
            }
          : charm,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const moveCharm = useCallback((id: string, attachmentPointId: string) => {
    setCurrentDesign((prev) => ({
      ...prev,
      charms: prev.charms.map((charm) => (charm.id === id ? { ...charm, attachmentPointId } : charm)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  /** Steps a charm to the next free attachment point in `direction` — shared by keyboard arrows and the touch nudge buttons. */
  const nudgeCharm = useCallback((id: string, direction: -1 | 1) => {
    setCurrentDesign((prev) => {
      const charm = prev.charms.find((c) => c.id === id);
      if (!charm) return prev;

      const occupied = getOccupiedAttachmentPointIds(prev.charms, id);
      const currentIndex = HOOP_ATTACHMENT_POINTS.findIndex((p) => p.id === charm.attachmentPointId);

      for (let next = currentIndex + direction; next >= 0 && next < HOOP_ATTACHMENT_POINTS.length; next += direction) {
        const candidate = HOOP_ATTACHMENT_POINTS[next];
        if (!occupied.has(candidate.id)) {
          return {
            ...prev,
            charms: prev.charms.map((c) => (c.id === id ? { ...c, attachmentPointId: candidate.id } : c)),
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return prev;
    });
  }, []);

  const deleteCharm = useCallback((id: string) => {
    setCurrentDesign((prev) => ({
      ...prev,
      charms: prev.charms.filter((charm) => charm.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const saveCurrentDesign = useCallback(
    (name?: string) => {
      const saved: JewelryDesign = {
        ...currentDesign,
        name: name ?? currentDesign.name,
        updatedAt: new Date().toISOString(),
      };
      setCurrentDesign(saved);
      const updatedList = appendToList(StorageKeys.recentDesigns, saved, 20);
      setRecentDesigns(updatedList);
      return saved;
    },
    [currentDesign],
  );

  const findDesignById = useCallback(
    (id: string) => {
      if (currentDesign.id === id) return currentDesign;
      if (DEMO_DESIGNS[id]) return DEMO_DESIGNS[id];
      return recentDesigns.find((d) => d.id === id);
    },
    [currentDesign, recentDesigns],
  );

  const value = useMemo<DesignContextValue>(
    () => ({
      currentDesign,
      recentDesigns,
      loadDesign,
      createFromConcept,
      setMaterial,
      addCharm,
      setBaseReference,
      duplicateCharm,
      updateCharm,
      moveCharm,
      nudgeCharm,
      deleteCharm,
      saveCurrentDesign,
      findDesignById,
    }),
    [
      currentDesign,
      recentDesigns,
      loadDesign,
      createFromConcept,
      setMaterial,
      addCharm,
      setBaseReference,
      duplicateCharm,
      updateCharm,
      moveCharm,
      nudgeCharm,
      deleteCharm,
      saveCurrentDesign,
      findDesignById,
    ],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignContextValue {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within DesignProvider");
  return ctx;
}

export function createEmptyDesign(productType?: JewelryDesign["productType"]): JewelryDesign {
  return emptyDesignFor(productType);
}
