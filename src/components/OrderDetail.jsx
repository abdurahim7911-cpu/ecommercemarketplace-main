import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { canCancel, money, NEXT_STATUS } from "@/lib/shop";
import { OrderTimeline, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

// mode: "customer" | "manager" (seller/admin)
export function OrderDetail({ id, mode = "customer", onChange }) {
  const [o, setO] = useState(null);
  const load = () =>
    supabase.from("orders").select("*, sellers(store_name), order_items(*), payments(*), order_status_history(*)").eq("id", id).maybeSingle().then(({ data }) => setO(data || false));
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order ${status}`);
    load();
    onChange?.();
  };

  if (o === null) return <p className="text-muted-foreground">Loading…</p>;
  if (o === false) return <p>Order not found.</p>;
  const next = NEXT_STATUS[o.status];
  const history = [...o.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Order #{o.id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">{o.sellers?.store_name || "bozor"} · {new Date(o.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>
      <OrderTimeline status={o.status} />
      <div className="flex flex-wrap gap-2">
        {mode === "manager" && next && <Button onClick={() => setStatus(next)}>Mark as {next}</Button>}
        {canCancel(o.status) ? (
          <Button variant="destructive" onClick={() => confirm("Cancel this order?") && setStatus("cancelled")}>Cancel order</Button>
        ) : (
          o.status !== "cancelled" && <p className="text-xs text-muted-foreground">Orders can only be cancelled while Pending or Confirmed.</p>
        )}
      </div>
      <div className="divide-y rounded-xl border">
        {o.order_items.map((i) => (
          <div key={i.id} className="flex justify-between p-3 text-sm"><span>{i.product_name} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></div>
        ))}
        <div className="flex justify-between p-3 font-bold"><span>Total</span><span>{money(o.total)}</span></div>
      </div>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl border p-3"><b>Ship to</b><p className="text-muted-foreground">{o.shipping_address}</p></div>
        <div className="rounded-xl border p-3"><b>Payment</b>{o.payments.map((p) => <p key={p.id} className="capitalize text-muted-foreground">{p.method} · {p.status} · {money(p.amount)}</p>)}</div>
      </div>
      <div>
        <b className="text-sm">History</b>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {history.map((h) => <li key={h.id} className="capitalize">{h.status} — {new Date(h.created_at).toLocaleString()}</li>)}
        </ul>
      </div>
    </div>
  );
}
