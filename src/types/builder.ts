export type PartCategory = "connecting" | "middle" | "swarovski";

export type ShapeKind = "stud" | "hook" | "ring" | "bar" | "drop" | "star" | "gem" | "heart";

/** A pickable base or part. Rendered either from a real cropped photo or a simple vector shape. */
export type BuildItem = {
  id: string;
  label: string;
  price: number;
  width: number;
  height: number;
  image?: string;
  shape?: ShapeKind;
  color?: string;
  category?: PartCategory;
};

/** One base or part the customer has placed on the canvas. */
export type PlacedItem = {
  uid: string;
  item: BuildItem;
  isBase: boolean;
  x: number;
  y: number;
};

export type BuilderCategory = {
  id: string;
  label: string;
  comingSoon?: boolean;
};
