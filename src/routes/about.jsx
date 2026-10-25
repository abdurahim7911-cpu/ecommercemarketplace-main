import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About bozor — our story" },
      { name: "description", content: "Why we built a marketplace for independent sellers." },
      { property: "og:title", content: "About bozor — our story" },
      { property: "og:description", content: "Why we built a marketplace for independent sellers." },
    ],
  }),
  component: () => (
    <div className="container-page max-w-3xl py-16">
      <h1 className="text-5xl font-extrabold">A bazaar, rebuilt for the internet.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        bozor brings the spirit of the traditional market online: many sellers, one place, honest prices. Customers browse, compare and order; sellers manage stock, orders and revenue from one dashboard.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[["3", "roles: customer, seller, admin"], ["6", "order stages, fully tracked"], ["0", "fees to start selling"]].map(([n, t]) => (
          <div key={t} className="rounded-2xl border bg-card p-6">
            <div className="font-display text-4xl font-extrabold text-primary">{n}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t}</p>
          </div>
        ))}
      </div>
    </div>
  ),
});
