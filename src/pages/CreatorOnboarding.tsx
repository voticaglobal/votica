import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { DefinitionRow } from "../components/common/DefinitionRow";
import { FieldGroup, Input, Textarea } from "../components/common/Field";
import { useDesign } from "../context/DesignContext";
import { calculateEstimatedPrice } from "../services/pricing";
import { appendToList, setItem, StorageKeys } from "../services/storage";
import { trackEvent } from "../services/analytics";
import { formatCurrency, generateId, slugify } from "../lib/utils";
import { fileToDataUrl } from "../lib/image";
import { CREATOR_COMMISSION_RATE, type Collection, type CreatorProfile } from "../types/creator";

export function CreatorOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const designId = searchParams.get("designId");
  const { findDesignById, currentDesign } = useDesign();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceDesign = (designId && findDesignById(designId)) || currentDesign;
  const defaultPrice = calculateEstimatedPrice(sourceDesign);

  const [creatorName, setCreatorName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [productName, setProductName] = useState(sourceDesign.name);
  const [price, setPrice] = useState(defaultPrice);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    trackEvent("creator_onboarding_started");
  }, []);

  const commission = Math.round(price * CREATOR_COMMISSION_RATE * 100) / 100;

  const canLaunch = creatorName.trim() && collectionName.trim() && productName.trim() && price > 0 && agreed;

  const handleLaunch = () => {
    if (!canLaunch) return;

    const slug = slugify(creatorName);
    const creator: CreatorProfile = {
      id: generateId("creator"),
      slug,
      name: creatorName,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
      bio: bio || undefined,
      profileImage,
      createdAt: new Date().toISOString(),
    };

    const collection: Collection = {
      id: generateId("collection"),
      slug: slugify(collectionName),
      creatorId: creator.id,
      name: collectionName,
      products: [
        {
          id: generateId("product"),
          designId: sourceDesign.id,
          name: productName,
          price,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    appendToList(StorageKeys.creatorProfile, creator, 20);
    appendToList(StorageKeys.collections, collection, 40);
    setItem("last-creator-slug", slug);

    trackEvent("creator_collection_created", { creatorSlug: slug, collectionSlug: collection.slug });
    navigate(`/creator/${slug}`);
  };

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <div className="mb-10 max-w-xl">
        <h1 className="text-3xl font-medium text-graphite sm:text-4xl">Turn your design into a collection.</h1>
        <p className="mt-3 text-graphite-soft">
          No inventory. No manufacturing setup. Create once and earn when your audience buys.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FieldGroup label="Creator Name" htmlFor="creator-name">
              <Input id="creator-name" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Instagram" htmlFor="instagram">
              <Input id="instagram" placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="TikTok" htmlFor="tiktok">
              <Input id="tiktok" placeholder="@yourhandle" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Collection Name" htmlFor="collection-name">
              <Input id="collection-name" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Product Name" htmlFor="product-name">
              <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Selling Price (USD)" htmlFor="price">
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Creator Bio" htmlFor="bio">
            <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </FieldGroup>

          <div>
            <p className="mb-1.5 text-sm font-medium text-graphite">Profile Image</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-graphite/20 bg-stone text-xs text-graphite-soft hover:border-champagne"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                "Upload"
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setProfileImage(await fileToDataUrl(file));
              }}
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-graphite-soft">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-graphite/30"
            />
            I confirm I have the right to use and sell this design or source material.
          </label>

          <Button size="lg" className="w-full sm:w-auto" disabled={!canLaunch} onClick={handleLaunch}>
            Launch My Collection
          </Button>
        </div>

        <Card className="h-fit p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
            Creator Economics
          </h3>
          <dl className="space-y-3 text-sm">
            <DefinitionRow label="Selling Price" value={formatCurrency(price)} />
            <DefinitionRow label="Creator Commission" value={`${Math.round(CREATOR_COMMISSION_RATE * 100)}%`} />
            <DefinitionRow label="You Earn" value={`${formatCurrency(commission)} per sale`} emphasize />
            <DefinitionRow label="Inventory" value="$0" />
            <DefinitionRow label="Production" value="vandida" />
            <DefinitionRow label="Fulfillment" value="vandida" />
          </dl>
        </Card>
      </div>
    </Container>
  );
}
