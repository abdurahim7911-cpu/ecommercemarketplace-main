import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — bozor" }, { name: "description", content: "Products you saved for later." }, { property: "og:title", content: "Wishlist — bozor" }, { property: "og:description", content: "Products you saved." }] }),
  component: Wishlist,
});

function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (user) supabase.from("wishlists").select("products(*, categories(name))").eq("user_id", user.id).then(({ data }) => setItems((data || []).map((d) => d.products).filter(Boolean)));
  }, [user]);
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-extrabold">Wishlist</h1>
      {items.length === 0 && <p className="mt-6 text-muted-foreground">Nothing saved yet — tap the heart on any product.</p>}
      <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  );
}
