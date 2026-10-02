import type { CharmInstance, JewelryConcept, JewelryDesign } from "../types/jewelry";
import type { CreatorProfile, Collection } from "../types/creator";
import { HOOP_ATTACHMENT_POINTS } from "./attachmentPoints";

export const DEMO_STORY =
  "Luna has been with me for seven years. I want something subtle that reminds me of her every day.";

export const DEMO_CONCEPTS: JewelryConcept[] = [
  {
    id: "concept-luna-memory",
    name: "Luna Memory",
    description: "A quiet silver hoop carrying Luna's paw, a small star, and her initial.",
    image: "",
    material: "silver",
    estimatedPrice: 149,
    productType: "hoop-earring",
    suggestedCharms: ["custom", "star", "initial"],
  },
  {
    id: "concept-forever-paw",
    name: "Forever Paw",
    description: "A single sculpted paw charm, minimal and easy to wear every day.",
    image: "",
    material: "gold-vermeil",
    estimatedPrice: 129,
    productType: "hoop-earring",
    suggestedCharms: ["paw"],
  },
  {
    id: "concept-quiet-orbit",
    name: "Quiet Orbit",
    description: "A moon and gem pairing, soft and a little celestial.",
    image: "",
    material: "rose-gold",
    estimatedPrice: 159,
    productType: "hoop-earring",
    suggestedCharms: ["moon", "gem"],
  },
];

const demoCharms: CharmInstance[] = [
  {
    id: "charm-demo-paw",
    type: "custom",
    attachmentPointId: HOOP_ATTACHMENT_POINTS[2].id,
    scale: 1,
    rotation: 0,
    material: "silver",
  },
  {
    id: "charm-demo-star",
    type: "star",
    attachmentPointId: HOOP_ATTACHMENT_POINTS[4].id,
    scale: 0.85,
    rotation: 0,
    material: "silver",
  },
  {
    id: "charm-demo-initial",
    type: "initial",
    attachmentPointId: HOOP_ATTACHMENT_POINTS[6].id,
    scale: 0.9,
    rotation: 0,
    material: "silver",
    text: "L",
  },
];

export const DEMO_DESIGN: JewelryDesign = {
  id: "design-luna-memory-hoop",
  name: "Luna Memory Hoop",
  productType: "hoop-earring",
  material: "silver",
  style: "minimal",
  gemstone: "none",
  story: DEMO_STORY,
  charms: demoCharms,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

export const DEMO_DESIGN_FOREVER_PAW: JewelryDesign = {
  id: "design-forever-paw",
  name: "Forever Paw",
  productType: "hoop-earring",
  material: "gold-vermeil",
  style: "minimal",
  gemstone: "none",
  charms: [
    {
      id: "charm-forever-paw",
      type: "paw",
      attachmentPointId: HOOP_ATTACHMENT_POINTS[4].id,
      scale: 1.1,
      rotation: 0,
      material: "gold-vermeil",
    },
  ],
  createdAt: "2026-08-02T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

export const DEMO_DESIGN_QUIET_ORBIT: JewelryDesign = {
  id: "design-quiet-orbit",
  name: "Quiet Orbit",
  productType: "hoop-earring",
  material: "rose-gold",
  style: "elegant",
  gemstone: "crystal",
  charms: [
    {
      id: "charm-quiet-orbit-moon",
      type: "moon",
      attachmentPointId: HOOP_ATTACHMENT_POINTS[3].id,
      scale: 1,
      rotation: 0,
      material: "rose-gold",
    },
    {
      id: "charm-quiet-orbit-gem",
      type: "gem",
      attachmentPointId: HOOP_ATTACHMENT_POINTS[5].id,
      scale: 0.9,
      rotation: 0,
      material: "rose-gold",
    },
  ],
  createdAt: "2026-08-02T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

export const DEMO_DESIGNS: Record<string, JewelryDesign> = {
  [DEMO_DESIGN.id]: DEMO_DESIGN,
  [DEMO_DESIGN_FOREVER_PAW.id]: DEMO_DESIGN_FOREVER_PAW,
  [DEMO_DESIGN_QUIET_ORBIT.id]: DEMO_DESIGN_QUIET_ORBIT,
};

export const DEMO_CREATOR: CreatorProfile = {
  id: "creator-luna-studio",
  slug: "luna-studio",
  name: "Luna Studio",
  instagram: "@lunastudio",
  bio: "Jewelry inspired by small moments.",
  createdAt: "2026-08-02T00:00:00.000Z",
};

export const DEMO_COLLECTION: Collection = {
  id: "collection-small-moments",
  slug: "small-moments",
  creatorId: DEMO_CREATOR.id,
  name: "Small Moments",
  story: "Jewelry inspired by the ones we never want to forget.",
  products: [
    { id: "p1", designId: DEMO_DESIGN.id, name: "Luna Memory Hoop", price: 149 },
    { id: "p2", designId: "design-forever-paw", name: "Forever Paw", price: 129 },
    { id: "p3", designId: "design-quiet-orbit", name: "Quiet Orbit", price: 159 },
  ],
  createdAt: "2026-08-02T00:00:00.000Z",
};
