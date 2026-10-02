import { useParams } from "react-router-dom";
import { AtSign } from "lucide-react";
import { Container } from "../components/common/Container";
import { ProductGrid } from "../components/creator/ProductGrid";
import { getCreatorBySlug, getCollectionsByCreatorId } from "../lib/creatorStore";

export function CreatorStorefront() {
  const { slug } = useParams<{ slug: string }>();

  const creator = slug ? getCreatorBySlug(slug) : undefined;
  const collections = creator ? getCollectionsByCreatorId(creator.id) : [];

  if (!creator) {
    return (
      <Container className="py-24 text-center">
        <p className="text-graphite-soft">We couldn't find that creator.</p>
      </Container>
    );
  }

  const allProducts = collections.flatMap((c) => c.products);

  return (
    <Container className="py-14 sm:py-20">
      <div className="mb-12 text-center">
        {creator.profileImage && (
          <img
            src={creator.profileImage}
            alt={creator.name}
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
          />
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne">
          {creator.name.toUpperCase()}
        </p>
        {creator.bio && <p className="mx-auto mt-3 max-w-md text-graphite-soft">{creator.bio}</p>}
        {creator.instagram && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-graphite-soft">
            <AtSign size={14} /> {creator.instagram}
          </p>
        )}
      </div>

      <ProductGrid products={allProducts} />

      <p className="mt-12 text-center text-sm text-graphite-soft">Made on demand by vandida.</p>
    </Container>
  );
}
