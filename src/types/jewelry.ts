export type MaterialType = "silver" | "gold-vermeil" | "rose-gold";

export type ProductType = "hoop-earring" | "pendant" | "ring" | "necklace";

export type StyleType = "minimal" | "cute" | "vintage" | "elegant" | "bold";

export type GemstoneType = "none" | "crystal" | "birthstone";

export type CharmType =
  | "heart"
  | "star"
  | "paw"
  | "moon"
  | "gem"
  | "initial"
  | "custom";

export type AttachmentPoint = {
  id: string;
  x: number;
  y: number;
  rotation: number;
};

export type CharmInstance = {
  id: string;
  type: CharmType;
  attachmentPointId: string;
  scale: number;
  rotation: number;
  material: MaterialType;
  customAssetUrl?: string;
  text?: string;
};

export type JewelryDesign = {
  id: string;
  name: string;
  productType: ProductType;
  material: MaterialType;
  style?: StyleType;
  gemstone?: GemstoneType;
  story?: string;
  sourceImage?: string;
  charms: CharmInstance[];
  createdAt: string;
  updatedAt: string;
};

export type JewelryConcept = {
  id: string;
  name: string;
  description: string;
  image: string;
  material: MaterialType;
  estimatedPrice: number;
  productType: ProductType;
  suggestedCharms: CharmType[];
};

export type GenerateConceptInput = {
  sourceImage?: string;
  story: string;
  productType: ProductType;
  style: StyleType;
  material: MaterialType;
  gemstone: GemstoneType;
};

export type CustomCharmStyle = "minimal" | "cute" | "sculptural" | "outline";

export type GenerateCharmInput = {
  image?: string;
  style: CustomCharmStyle;
  prompt?: string;
};

export type GeneratedCharm = {
  id: string;
  assetUrl: string;
  style: CustomCharmStyle;
  label: string;
};

export type ValidationIssue = {
  field?: string;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  issues: ValidationIssue[];
};

export type ProductionRequest = {
  id: string;
  designId: string;
  name: string;
  email: string;
  country: string;
  note?: string;
  submittedAt: string;
};
