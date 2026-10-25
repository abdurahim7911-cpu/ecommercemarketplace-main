import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — bozor" },
      { name: "description", content: "Browse bozor products by category." },
      { property: "og:title", content: "Categories — bozor" },
      { property: "og:description", content: "Browse bozor products by category." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    supabase.from("categories").select("*, products(count)").order("name").then(({ data }) => setCats(data || []));
  }, []);
  return (
    <div className="container-page py-12">
      <h1 className="text-4xl font-extrabold">Categories</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => (
          <Link key={c.id} to="/products" search={{ category: c.slug }} className={`rounded-3xl  p-8 shadow-card transition hover:-translate-y-1 ${i % 3 === 0 ? "bg-card" : i % 3 === 1 ? "bg-accent text-accent-foreground" : "bg-card"}`}>
            <h2 className="text-2xl font-bold">{c.name}</h2>
            <p className="mt-1 text-sm opacity-75">{c.products?.[0]?.count ?? 0} products</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
