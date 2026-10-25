import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getCartId, money } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "Your cart — bozor" }, { name: "description", content: "Review items in your cart." }, { property: "og:title", content: "Your cart — bozor" }, { property: "og:description", content: "Review items in your cart." }] }),
  component: Cart,
});

function Cart() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);

  const load = async () => {
    const cartId = await getCartId(user.id);
    const { data } = await supabase.from("cart_items").select("id, quantity, products(id, name, price, image_url, stock)").eq("cart_id", cartId);
    setItems(data || []);
    window.dispatchEvent(new Event("cart-changed"));
  };
  useEffect(() => { if (user) load(); }, [user]);

  const setQty = async (it, q) => {
    if (q < 1) await supabase.from("cart_items").delete().eq("id", it.id);
    else await supabase.from("cart_items").update({ quantity: Math.min(q, it.products.stock) }).eq("id", it.id);
    load();
  };

  if (!items) return <div className="container-page py-16 text-muted-foreground">Loading…</div>;
  const total = items.reduce((s, i) => s + i.quantity * Number(i.products.price), 0);

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-extrabold">Cart</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4"><Link to="/products">Browse products</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="divide-y rounded-2xl border bg-card">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-4 p-4">
                <img src={it.products.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <Link to="/products/$id" params={{ id: it.products.id }} className="font-semibold">{it.products.name}</Link>
                  <div className="text-sm text-muted-foreground">{money(it.products.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setQty(it, it.quantity - 1)}><Minus /></Button>
                  <span className="w-6 text-center">{it.quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => setQty(it, it.quantity + 1)}><Plus /></Button>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setQty(it, 0)}><Trash2 /></Button>
              </div>
            ))}
          </div>
          <div className="h-fit rounded-2xl border bg-card p-6">
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
            <Button asChild className="mt-6 w-full" size="lg"><Link to="/checkout">Checkout</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
