import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addToCart, money, toggleWishlist } from "@/lib/shop";

const productImageByCategory = [
  [/fashion|clothing|shoes|sneaker|apparel|bag/i, "photo-1490481651871-ab68de25d43d"],
  [/electronic|phone|headphone|speaker|watch|tech/i, "photo-1505740420928-5e560c06d30e"],
  [/home|decor|vase|lamp|furniture/i, "photo-1494438639946-1ebd1d20bf85"],
  [/book|stationery|art/i, "photo-1544947950-fa07a98d237f"],
];
function fallbackProductImage(product) {
  const category = product.categories?.name || "";
  const name = product.name || "";
  const match = productImageByCategory.find(([pattern]) => pattern.test(`${category} ${name}`));
  const photo = match?.[1] || "photo-1523275335684-37898b6baf30";
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`;
}

export function ProductCard({ product }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const requireUser = () => {
    if (!user) {
      toast("Please sign in first");
      navigate({ to: "/auth" });
      return false;
    }
    return true;
  };

  return (
    <div className="product-card group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition">
      <Link to="/products/$id" params={{ id: product.id }} className="product-image-wrap relative aspect-square overflow-hidden bg-muted">
        <img src={product.image_url || fallbackProductImage(product)} alt={product.name} loading="lazy" className="product-image h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="product-image-shine" />
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">Sold out</span>
        )}
      </Link>
      <button
        aria-label="Add to wishlist"
        onClick={async () => {
          if (!requireUser()) return;
          const added = await toggleWishlist(user.id, product.id);
          toast(added ? "Added to wishlist" : "Removed from wishlist");
        }}
        className="relative z-10 -mt-12 ml-auto mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-card hover:text-destructive"
      >
        <Heart className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col gap-1 p-4 pt-2">
        <span className="text-xs text-muted-foreground">{product.categories?.name}</span>
        <Link to="/products/$id" params={{ id: product.id }} className="font-semibold leading-tight hover:underline">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg font-bold">{money(product.price)}</span>
          <button
            disabled={product.stock === 0}
            onClick={async () => {
              if (!requireUser()) return;
              try {
                await addToCart(user.id, product.id);
                toast.success("Added to cart");
              } catch (e) {
                toast.error(e.message);
              }
            }}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            <ShoppingBag className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
