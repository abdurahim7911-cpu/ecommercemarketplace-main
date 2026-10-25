import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/products/")({
  validateSearch: (s) => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    min: s.min ? Number(s.min) : undefined,
    max: s.max ? Number(s.max) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop all products — bozor" },
      { name: "description", content: "Search and filter products by category and price." },
      { property: "og:title", content: "Shop all products — bozor" },
      { property: "og:description", content: "Search and filter products by category and price." },
    ],
  }),
  component: Products,
});

function Products() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState(null);
  const set = (patch) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setCats(data || []));
  }, []);

  useEffect(() => {
    let query = supabase.from("products").select("*, categories!inner(name, slug)").eq("is_active", true);
    if (search.q) query = query.ilike("name", `%${search.q}%`);
    if (search.category) query = query.eq("categories.slug", search.category);
    if (search.min != null) query = query.gte("price", search.min);
    if (search.max != null) query = query.lte("price", search.max);
    if (search.sort === "price_asc") query = query.order("price");
    else if (search.sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    query.then(({ data }) => setItems(data || []));
  }, [search.q, search.category, search.min, search.max, search.sort]);

  return (
    <div className="container-page grid gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <label className="text-sm font-semibold">Search</label>
          <input defaultValue={search.q} onKeyDown={(e) => e.key === "Enter" && set({ q: e.currentTarget.value || undefined })} placeholder="Press Enter" className="mt-2 h-10 w-full rounded-lg border bg-card px-3 text-sm" />
        </div>
        <div>
          <b className="text-sm">Category</b>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <button onClick={() => set({ category: undefined })} className={`rounded-md px-2 py-1 text-left ${!search.category ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>All</button>
            {cats.map((c) => (
              <button key={c.id} onClick={() => set({ category: c.slug })} className={`rounded-md px-2 py-1 text-left ${search.category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{c.name}</button>
            ))}
          </div>
        </div>
        <div>
          <b className="text-sm">Price</b>
          <div className="mt-2 flex gap-2">
            <input type="number" placeholder="Min" defaultValue={search.min} onBlur={(e) => set({ min: e.target.value || undefined })} className="h-9 w-full rounded-lg border bg-card px-2 text-sm" />
            <input type="number" placeholder="Max" defaultValue={search.max} onBlur={(e) => set({ max: e.target.value || undefined })} className="h-9 w-full rounded-lg border bg-card px-2 text-sm" />
          </div>
        </div>
      </aside>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{search.q ? `Results for “${search.q}”` : "All products"}</h1>
          <select value={search.sort || ""} onChange={(e) => set({ sort: e.target.value || undefined })} className="h-10 rounded-lg border bg-card px-3 text-sm">
            <option value="">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        {items === null ? (
          <p className="mt-10 text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-10 text-muted-foreground">No products match your filters.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
