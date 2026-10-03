import type { BuildItem, BuilderCategory, PartCategory } from "../types/builder";

export const BUILDER_CATEGORIES: BuilderCategory[] = [
  { id: "earrings", label: "Earrings" },
  { id: "piercings", label: "Piercings", comingSoon: true },
  { id: "ear-cuffs", label: "Ear Cuffs", comingSoon: true },
  { id: "necklaces", label: "Necklaces", comingSoon: true },
  { id: "bracelets", label: "Bracelets", comingSoon: true },
  { id: "allergy-free", label: "Allergy-Free", comingSoon: true },
];

export const BUILDER_BASES: BuildItem[] = [
  { id: "base-stud", label: "Classic Stud", price: 8, width: 26, height: 26, shape: "stud", color: "#c9a86a" },
  { id: "base-hook", label: "Fish Hook", price: 10, width: 22, height: 42, shape: "hook", color: "#c9a86a" },
  { id: "base-huggie", label: "Huggie Hoop", price: 12, width: 32, height: 32, shape: "ring", color: "#c9a86a" },
  {
    id: "base-vintage",
    label: "Vintage Pendant Base",
    price: 14,
    width: 48,
    height: 48,
    image: "/votica-assets/ACC_2.png",
  },
];

export const BUILDER_PARTS: BuildItem[] = [
  // Connecting parts
  { id: "part-bar", label: "Bar Connector", price: 3, width: 28, height: 8, shape: "bar", color: "#9a8f80", category: "connecting" },
  { id: "part-ring", label: "Jump Ring", price: 2, width: 14, height: 14, shape: "ring", color: "#9a8f80", category: "connecting" },
  { id: "part-chain", label: "Chain Link", price: 4, width: 10, height: 36, shape: "bar", color: "#c9a86a", category: "connecting" },

  // Middle components
  { id: "part-drop-rose", label: "Rose Drop", price: 6, width: 22, height: 28, shape: "drop", color: "#e3a9a0", category: "middle" },
  { id: "part-drop-sage", label: "Sage Drop", price: 6, width: 22, height: 28, shape: "drop", color: "#a9b79c", category: "middle" },
  { id: "part-heart", label: "Heart Charm", price: 5, width: 22, height: 20, shape: "heart", color: "#c97f8c", category: "middle" },
  { id: "part-star", label: "Star Charm", price: 5, width: 24, height: 24, shape: "star", color: "#d8c27a", category: "middle" },
  {
    id: "part-flower-tassel",
    label: "Flower Tassel",
    price: 9,
    width: 40,
    height: 40,
    image: "/votica-assets/ACC_1.png",
    category: "middle",
  },

  // Swarovski-style gems
  { id: "gem-clear", label: "Clear Crystal", price: 7, width: 16, height: 16, shape: "gem", color: "#e8edf2", category: "swarovski" },
  { id: "gem-sapphire", label: "Sapphire Crystal", price: 7, width: 16, height: 16, shape: "gem", color: "#4f6fa8", category: "swarovski" },
  { id: "gem-emerald", label: "Emerald Crystal", price: 7, width: 16, height: 16, shape: "gem", color: "#4f9a6f", category: "swarovski" },
  { id: "gem-ruby", label: "Ruby Crystal", price: 7, width: 16, height: 16, shape: "gem", color: "#a84f55", category: "swarovski" },
  { id: "gem-amethyst", label: "Amethyst Crystal", price: 7, width: 16, height: 16, shape: "gem", color: "#8a6fa8", category: "swarovski" },
];

export const PART_CATEGORY_TABS: { id: PartCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "connecting", label: "Connecting" },
  { id: "middle", label: "Middle" },
  { id: "swarovski", label: "Swarovski" },
];

export const BUILDER_EAR_PHOTO = "/votica-assets/ear.png";
