import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile — bozor" }, { name: "description", content: "Manage your account details." }, { property: "og:title", content: "My profile — bozor" }, { property: "og:description", content: "Manage your account." }] }),
  component: Profile,
});

function Profile() {
  const { user, roles } = useAuth();
  const [p, setP] = useState({ full_name: "", phone: "", address: "" });
  useEffect(() => {
    if (user) supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => data && setP(data));
  }, [user]);
  const save = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({ full_name: p.full_name, phone: p.phone, address: p.address }).eq("id", user.id);
    error ? toast.error(error.message) : toast.success("Profile saved");
  };
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-4xl font-extrabold">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email} · roles: {roles.join(", ")}</p>
      <form onSubmit={save} className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
        {[["full_name", "Full name"], ["phone", "Phone"], ["address", "Default shipping address"]].map(([k, l]) => (
          <div key={k}>
            <label className="text-sm font-semibold">{l}</label>
            <input value={p[k] || ""} onChange={(e) => setP({ ...p, [k]: e.target.value })} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" />
          </div>
        ))}
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
