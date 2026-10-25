
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "bozor — shop from independent sellers" },
      {
        name: "description",
        content:
          "A mini marketplace: browse products, order from sellers and track every delivery.",
      },
      {
        property: "og:title",
        content: "bozor — shop from independent sellers",
      },
      {
        property: "og:description",
        content:
          "Browse products, order from sellers and track every delivery.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from("products")
          .select("*, categories(name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8),

        supabase.from("categories").select("*").order("name"),
      ]);

      setProducts(productsResult.data || []);
      setCats(categoriesResult.data || []);
    }

    loadData();
  }, []);

  const features = [
    {
      Icon: Truck,
      title: "Tracked delivery",
      description:
        "Follow every step: confirmed, shipped, delivered.",
    },
    {
      Icon: ShieldCheck,
      title: "Safe ordering",
      description:
        "Cancel free while your order is pending or confirmed.",
    },
    {
      Icon: Store,
      title: "Real sellers",
      description:
        "Every product comes from a verified independent store.",
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="hero-shell text-white">
        <div className="container-page hero-grid grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <span className="eyebrow-pulse" />
              CURATED FINDS · INDEPENDENT BRANDS
            </span>

            <h1 className="hero-title mt-5 text-5xl font-extrabold leading-[1.02] text-white md:text-7xl">
              Find your next{" "}
              <span className="hero-gradient-text inline-block bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                favorite thing.
              </span>
            </h1>

            <p className="hero-copy mt-5 max-w-md text-white/80">
              Discover products from independent stores. Order in a
              click and follow your package from confirmation to your
              door.
            </p>

            <div className="hero-actions mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/products">
                  Start shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="heroOutline" size="lg">
                <Link to="/sell">Open a store</Link>
              </Button>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=88"
              alt="Curated fashion and lifestyle products"
              width={1400}
              height={1100}
            />

            <div className="hero-image-glow" />

            <div className="floating-note">
              <span className="floating-note-icon">✦</span>
              <span>
                <b>Good taste, discovered.</b>
                <small>Pieces worth keeping.</small>
              </span>
            </div>

            <div className="hero-index">
              01 <span /> 04
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-page feature-strip grid gap-4 py-12 md:grid-cols-3">
        {features.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="feature-card flex gap-4 rounded-2xl border bg-card p-5"
          >
            <Icon className="h-6 w-6 shrink-0 text-primary" />

            <div>
              <b className="text-foreground">{title}</b>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section className="container-page category-section">
        <div className="section-kicker">EXPLORE THE EDIT</div>

        <h2 className="section-title text-3xl font-bold text-foreground">
          Shop by category
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          {cats.map((category) => (
            <Link
              key={category.id}
              to="/products"
              search={{ category: category.slug }}
              className="category-tile rounded-2xl border bg-card p-5 text-center font-semibold text-card-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-page arrivals-section mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="section-kicker">FRESH TO THE MARKET</div>

            <h2 className="section-title text-3xl font-bold text-foreground">
              New arrivals
            </h2>
          </div>

          <Link
            to="/products"
            className="shrink-0 text-sm font-medium text-primary transition-opacity hover:opacity-70"
          >
            View all →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">
            No products available yet.
          </p>
        )}
      </section>
    </>
  );
}