import { getItem, StorageKeys } from "../services/storage";
import { DEMO_CREATOR, DEMO_COLLECTION } from "../data/demo";
import type { CreatorProfile, Collection } from "../types/creator";

export function getCreatorBySlug(slug: string): CreatorProfile | undefined {
  const saved = getItem<CreatorProfile[]>(StorageKeys.creatorProfile, []);
  return saved.find((c) => c.slug === slug) ?? (slug === DEMO_CREATOR.slug ? DEMO_CREATOR : undefined);
}

export function getCreatorById(creatorId: string): CreatorProfile | undefined {
  const saved = getItem<CreatorProfile[]>(StorageKeys.creatorProfile, []);
  return saved.find((c) => c.id === creatorId) ?? (creatorId === DEMO_CREATOR.id ? DEMO_CREATOR : undefined);
}

export function getCollectionsByCreatorId(creatorId: string): Collection[] {
  const saved = getItem<Collection[]>(StorageKeys.collections, []);
  const own = saved.filter((c) => c.creatorId === creatorId);
  if (creatorId === DEMO_CREATOR.id) return [DEMO_COLLECTION, ...own];
  return own;
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  const saved = getItem<Collection[]>(StorageKeys.collections, []);
  return saved.find((c) => c.slug === slug) ?? (slug === DEMO_COLLECTION.slug ? DEMO_COLLECTION : undefined);
}
