import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, LayoutDashboard, LogOut, Search, Shield, ShoppingBag, User, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/sell", label: "Sell" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, isSeller, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("bozor-theme");
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("bozor-theme", next);
  };

  useEffect(() => {
    if (!user) return setCount(0);
    const load = async () => {
      const { data } = await supabase.from("carts").select("cart_items(quantity)").eq("user_id", user.id).maybeSingle();
      setCount((data?.cart_items || []).reduce((s, i) => s + i.quantity, 0));
    };
    load();
    window.addEventListener("cart-changed", load);
    return () => window.removeEventListener("cart-changed", load);
  }, [user]);

  return (
    <header className="site-header sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-[76px] items-center gap-5">
        <Link to="/" className="brand-mark font-display text-2xl font-extrabold tracking-tight">
          bozor<span className="brand-dot">+</span>
        </Link>
        <nav className="hidden gap-5 text-sm lg:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="nav-link text-muted-foreground hover:text-foreground" activeProps={{ className: "nav-link text-foreground font-semibold" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <form
          className="ml-auto hidden max-w-xs flex-1 items-center gap-2 rounded-full border bg-card px-3 md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/products", search: { q } });
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="h-9 w-full bg-transparent text-sm outline-none" />
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button type="button" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme} className="theme-toggle" >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" title="Admin" className="rounded-full p-2 hover:bg-muted"><Shield className="h-5 w-5" /></Link>
              )}
              {isSeller && (
                <Link to="/seller" title="Seller dashboard" className="rounded-full p-2 hover:bg-muted"><LayoutDashboard className="h-5 w-5" /></Link>
              )}
              <Link to="/wishlist" title="Wishlist" className="rounded-full p-2 hover:bg-muted"><Heart className="h-5 w-5" /></Link>
              <Link to="/cart" title="Cart" className="relative rounded-full p-2 hover:bg-muted">
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{count}</span>
                )}
              </Link>
              <Link to="/profile" title="Profile" className="rounded-full p-2 hover:bg-muted"><User className="h-5 w-5" /></Link>
              <button
                title="Sign out"
                className="rounded-full p-2 hover:bg-muted"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", replace: true });
                }}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted">Sign in</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer mt-24 border-t bg-secondary/50">
      <div className="container-page grid gap-8 py-12 text-sm md:grid-cols-4">
        <div>
          <div className="brand-mark font-display text-xl font-extrabold">bozor<span className="brand-dot">+</span></div>
          <p className="mt-2 text-muted-foreground">A mini marketplace connecting independent sellers with customers.</p>
        </div>
        <div className="flex flex-col gap-2">
          <b>Shop</b>
          <Link to="/products" className="text-muted-foreground hover:text-foreground">All products</Link>
          <Link to="/categories" className="text-muted-foreground hover:text-foreground">Categories</Link>
        </div>
        <div className="flex flex-col gap-2">
          <b>Company</b>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/sell" className="text-muted-foreground hover:text-foreground">Become a seller</Link>
        </div>
        <div className="flex flex-col gap-2">
          <b>Help</b>
          <Link to="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
