import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Package, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on bozor — open your store" },
      { name: "description", content: "Open a free store, list products and track sales and revenue." },
      { property: "og:title", content: "Sell on bozor — open your store" },
      { property: "og:description", content: "Open a free store, list products and track sales and revenue." },
    ],
  }),
  component: () => (
    <div>
      <section className="bg-hero text-primary-foreground">
        <div className="container-page py-20 text-center">
          <h1 className="mx-auto max-w-2xl text-5xl font-extrabold">Your store. Our customers.</h1>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/75">List products in minutes, manage orders through every stage and watch revenue grow.</p>
          <Button asChild variant="hero" size="lg" className="mt-8"><Link to="/auth" search={{ mode: "signup", seller: "1" }}>Open my store</Link></Button>
        </div>
      </section>
      <section className="container-page grid gap-5 py-14 md:grid-cols-3">
        {[[Package, "Products & stock", "Add, edit and hide products. Stock updates automatically on orders and cancellations."], [Wallet, "Orders", "Confirm, process, ship and deliver — the system enforces the right order."], [BarChart3, "Statistics", "Revenue, sales count and best sellers on your dashboard."]].map(([I, t, d]) => (
          <div key={t} className="rounded-2xl border bg-card p-6"><I className="h-7 w-7 text-primary" /><h3 className="mt-3 text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </section>
    </div>
  ),
});
