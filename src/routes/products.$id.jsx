import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { addToCart, money, toggleWishlist } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Product details — bozor" },
      { name: "description", content: "Product details, seller info and customer reviews." },
      { property: "og:title", content: "Product details — bozor" },
      { property: "og:description", content: "Product details, seller info and customer reviews." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const loadReviews = () =>
    supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }).then(({ data }) => setReviews(data || []));

  useEffect(() => {
    supabase.from("products").select("*, categories(name), sellers(store_name)").eq("id", id).maybeSingle().then(({ data }) => setP(data || false));
    loadReviews();
  }, [id]);

  if (p === null) return <div className="container-page py-20 text-muted-foreground">Loading…</div>;
  if (p === false) return <div className="container-page py-20">Product not found.</div>;

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const needUser = () => { if (!user) { navigate({ to: "/auth" }); return false; } return true; };

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <img src={p.image_url} alt={p.name} className="aspect-square w-full rounded-3xl border object-cover" />
        <div>
          <span className="text-sm text-muted-foreground">{p.categories?.name} · sold by <b>{p.sellers?.store_name || "bozor"}</b></span>
          <h1 className="mt-2 text-4xl font-extrabold">{p.name}</h1>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-accent text-accent" /> {avg.toFixed(1)} · {reviews.length} reviews
          </div>
          <div className="mt-6 font-display text-4xl font-bold">{money(p.price)}</div>
          <p className="mt-4 text-muted-foreground">{p.description}</p>
          <p className="mt-4 text-sm">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
          <div className="mt-6 flex items-center gap-3">
            <input type="number" min={1} max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="h-11 w-20 rounded-lg border bg-card px-3" />
            <Button size="lg" disabled={p.stock === 0} onClick={async () => {
              if (!needUser()) return;
              try { await addToCart(user.id, p.id, qty); toast.success("Added to cart"); } catch (e) { toast.error(e.message); }
            }}>Add to cart</Button>
            <Button size="lg" variant="outline" onClick={async () => {
              if (!needUser()) return;
              toast((await toggleWishlist(user.id, p.id)) ? "Added to wishlist" : "Removed from wishlist");
            }}><Heart /></Button>
          </div>
        </div>
      </div>

      <section className="mt-16 max-w-2xl">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {user && (
          <form className="mt-4 space-y-3 rounded-2xl border bg-card p-4" onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.from("reviews").insert({ product_id: id, user_id: user.id, rating, comment });
            if (error) return toast.error(error.code === "23505" ? "You already reviewed this product" : error.message);
            setComment(""); loadReviews(); toast.success("Thanks for your review");
          }}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}>
                  <Star className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts" className="w-full rounded-lg border bg-background p-3 text-sm" />
            <Button type="submit" size="sm">Post review</Button>
          </form>
        )}
        <div className="mt-6 space-y-4">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="border-b pb-4">
              <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}</div>
              <p className="mt-1 text-sm">{r.comment}</p>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
