import { Link, useParams } from "react-router-dom";
import { Container } from "../components/common/Container";
import { ProductGrid } from "../components/creator/ProductGrid";
import { getCollectionBySlug, getCreatorById } from "../lib/creatorStore";

export function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();

  const collection = slug ? getCollectionBySlug(slug) : undefined;
  const creator = collection ? getCreatorById(collection.creatorId) : undefined;

  if (!collection) {
    return (
      <Container className="py-24 text-center">
        <p className="text-graphite-soft">We couldn't find that collection.</p>
      </Container>
    );
  }

  return (
    <Container className="py-14 sm:py-20">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne">
          {collection.name.toUpperCase()}
        </p>
        {creator && (
          <p className="mt-2 text-sm text-graphite-soft">
            by{" "}
            <Link to={`/creator/${creator.slug}`} className="underline underline-offset-2 hover:text-graphite">
              {creator.name}
            </Link>
          </p>
        )}
        {collection.story && <p className="mx-auto mt-4 max-w-md text-graphite-soft">{collection.story}</p>}
      </div>

      <ProductGrid products={collection.products} />
    </Container>
  );
}
