import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getCartId, money } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — bozor" }, { name: "description", content: "Confirm your delivery details and place your order." }, { property: "og:title", content: "Checkout — bozor" }, { property: "og:description", content: "Place your order." }] }),
  component: Checkout,
});

function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const cartId = await getCartId(user.id);
      const { data } = await supabase.from("cart_items").select("quantity, products(name, price)").eq("cart_id", cartId);
      setItems(data || []);
      const { data: prof } = await supabase.from("profiles").select("address").eq("id", user.id).maybeSingle();
      if (prof?.address) setAddress(prof.address);
    })();
  }, [user]);

  const total = items.reduce((s, i) => s + i.quantity * Number(i.products.price), 0);

  const place = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("place_order", { _address: address, _method: method });
    setBusy(false);
    if (error) return toast.error(error.message);
    window.dispatchEvent(new Event("cart-changed"));
    toast.success("Order placed!");
    navigate({ to: "/orders" });
  };

  return (
    <div className="container-page grid max-w-4xl gap-8 py-10 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold">Checkout</h1>
        <label className="block text-sm font-semibold">Shipping address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full rounded-lg border bg-card p-3" placeholder="Street, city, phone" />
        <label className="block text-sm font-semibold">Payment</label>
        <div className="grid grid-cols-2 gap-2">
          {[["cash", "Cash on delivery"], ["card", "Card (demo)"]].map(([v, l]) => (
            <button key={v} onClick={() => setMethod(v)} className={`rounded-xl border p-3 text-sm ${method === v ? "border-primary bg-primary/5 font-semibold" : "bg-card"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="h-fit rounded-2xl border bg-card p-6">
        <h2 className="font-bold">Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          {items.map((i, k) => <div key={k} className="flex justify-between"><span>{i.products.name} × {i.quantity}</span><span>{money(i.quantity * i.products.price)}</span></div>)}
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
        <p className="mt-2 text-xs text-muted-foreground">Items from different sellers become separate orders.</p>
        <Button className="mt-6 w-full" size="lg" disabled={busy || !items.length || !address.trim()} onClick={place}>Place order</Button>
      </div>
    </div>
  );
}
