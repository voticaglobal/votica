export type CreatorProfile = {
  id: string;
  slug: string;
  name: string;
  instagram?: string;
  tiktok?: string;
  bio?: string;
  profileImage?: string;
  createdAt: string;
};

export type CreatorProduct = {
  id: string;
  designId: string;
  name: string;
  price: number;
  image?: string;
};

export type Collection = {
  id: string;
  slug: string;
  creatorId: string;
  name: string;
  story?: string;
  products: CreatorProduct[];
  createdAt: string;
};

export const CREATOR_COMMISSION_RATE = 0.15;
