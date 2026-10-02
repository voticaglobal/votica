import { useNavigate } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { useDesign } from "../../context/DesignContext";
import { trackEvent } from "../../services/analytics";
import type { CreatorProduct } from "../../types/creator";

/** Shared catalog grid used by both the creator storefront and individual collection pages. */
export function ProductGrid({ products }: { products: CreatorProduct[] }) {
  const navigate = useNavigate();
  const { findDesignById, loadDesign } = useDesign();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const design = findDesignById(product.designId);
        return (
          <ProductCard
            key={product.id}
            name={product.name}
            price={product.price}
            design={design}
            onCustomize={() => {
              if (design) loadDesign(design);
              navigate("/studio");
            }}
            onBuy={() => {
              trackEvent("landing_cta_clicked", { cta: "buy", productId: product.id });
              navigate(`/design/${product.designId}`);
            }}
          />
        );
      })}
    </div>
  );
}
