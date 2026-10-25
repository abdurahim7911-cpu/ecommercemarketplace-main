import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/shop";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({ meta: [{ title: "Order history — bozor" }, { name: "description", content: "All your orders and their status." }, { property: "og:title", content: "Order history — bozor" }, { property: "og:description", content: "Your orders." }] }),
  component: Orders,
});

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    if (user) supabase.from("orders").select("*, sellers(store_name), order_items(id)").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
  }, [user]);
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-extrabold">Order history</h1>
      {orders?.length === 0 && <p className="mt-6 text-muted-foreground">No orders yet.</p>}
      <div className="mt-6 divide-y rounded-2xl border bg-card">
        {(orders || []).map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex flex-wrap items-center gap-4 p-4 hover:bg-muted/50">
            <div className="flex-1">
              <div className="font-semibold">#{o.id.slice(0, 8)} · {o.sellers?.store_name || "bozor"}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.order_items.length} items</div>
            </div>
            <StatusBadge status={o.status} />
            <span className="w-24 text-right font-bold">{money(o.total)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
