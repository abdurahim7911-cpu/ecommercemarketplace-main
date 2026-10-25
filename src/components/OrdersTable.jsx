import { useState } from "react";
import { money } from "@/lib/shop";
import { StatusBadge } from "@/components/StatusBadge";

export function OrdersTable({ orders, onOpen }) {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  return (
    <div className="mt-8 space-y-4">
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-lg border bg-card px-3 text-sm">
        {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <div className="divide-y rounded-2xl border bg-card">
        {list.length === 0 && <p className="p-6 text-muted-foreground">No orders.</p>}
        {list.map((o) => (
          <button key={o.id} onClick={() => onOpen(o.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/50">
            <div className="flex-1">
              <div className="font-semibold">#{o.id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <StatusBadge status={o.status} />
            <span className="w-24 text-right font-bold">{money(o.total)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
