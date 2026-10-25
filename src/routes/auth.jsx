import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => ({
    mode: s.mode === "signup" ? "signup" : undefined,
    seller: s.seller ? String(s.seller) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — bozor" },
      { name: "description", content: "Sign in to bozor as a customer or seller." },
      { property: "og:title", content: "Sign in — bozor" },
      { property: "og:description", content: "Sign in to bozor as a customer or seller." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState(search.mode || "signin");
  const [role, setRole] = useState(search.seller ? "seller" : "customer");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/products" }); }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: f.get("email"),
          password: f.get("password"),
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: f.get("name"), role, store_name: f.get("store") || undefined },
          },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-card">
        <h1 className="text-3xl font-extrabold">{mode === "signup" ? "Create account" : "Welcome back"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 text-sm">
                {[["customer", "I want to buy"], ["seller", "I want to sell"]].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setRole(v)} className={`rounded-lg py-2 font-medium ${role === v ? "bg-card shadow-card" : "text-muted-foreground"}`}>{l}</button>
                ))}
              </div>
              <input name="name" required placeholder="Full name" className="h-11 w-full rounded-lg border bg-background px-3" />
              {role === "seller" && <input name="store" required placeholder="Store name" className="h-11 w-full rounded-lg border bg-background px-3" />}
            </>
          )}
          <input name="email" type="email" required placeholder="Email" className="h-11 w-full rounded-lg border bg-background px-3" />
          <input name="password" type="password" required minLength={6} placeholder="Password" className="h-11 w-full rounded-lg border bg-background px-3" />
          <Button type="submit" disabled={busy} className="h-11 w-full">{mode === "signup" ? "Sign up" : "Sign in"}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        <Button variant="outline" className="h-11 w-full" onClick={async () => {
          const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
          if (r.error) toast.error(r.error.message || "Google sign-in failed");
        }}>Continue with Google</Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to bozor?"}{" "}
          <button className="font-semibold text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
