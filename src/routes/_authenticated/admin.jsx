import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OrderDetail } from "@/components/OrderDetail";
import { Stat, Tabs } from "@/components/Stat";
import { OrdersTable } from "@/components/OrdersTable";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin panel — bozor" }, { name: "description", content: "Manage users, sellers, products, categories and orders." }, { property: "og:title", content: "Admin panel — bozor" }, { property: "og:description", content: "Marketplace administration." }] }),
  component: Admin,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState("reports");
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [newCat, setNewCat] = useState("");

  const load = async () => {
    const [u, s, p, c, o] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("sellers").select("*, products(count)").order("created_at", { ascending: false }),
      supabase.from("products").select("*, sellers(store_name), categories(name)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*, products(count)").order("name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    setUsers(u.data || []); setSellers(s.data || []); setProducts(p.data || []); setCats(c.data || []); setOrders(o.data || []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <div className="container-page py-20 text-center text-muted-foreground">Admins only.</div>;

  const run = async (promise, msg) => {
    const { error } = await promise;
    if (error) return toast.error(error.message);
    if (msg) toast.success(msg);
    load();
  };

  const byStatus = Object.entries(orders.reduce((m, o) => ((m[o.status] = (m[o.status] || 0) + 1), m), {})).map(([name, value]) => ({ name, value }));
  const gmv = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const delivered = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
  const field = "h-10 rounded-lg border bg-background px-3 text-sm";

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold">Admin</h1>
        <Tabs tabs={["reports", "users", "sellers", "products", "categories", "orders"]} value={tab} onChange={setTab} />
      </div>

      {tab === "reports" && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Gross sales" value={money(gmv)} hint="Excluding cancelled" />
            <Stat label="Delivered revenue" value={money(delivered)} />
            <Stat label="Orders" value={orders.length} hint={`${orders.filter((o) => o.status === "cancelled").length} cancelled`} />
            <Stat label="Users / Sellers" value={`${users.length} / ${sellers.length}`} hint={`${products.length} products`} />
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <b>Orders by status</b>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1"><div className="font-semibold">{u.full_name || "—"}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
              {["seller", "admin"].map((r) => {
                const has = u.roles.includes(r);
                return (
                  <Button key={r} size="sm" variant={has ? "default" : "outline"} onClick={() => run(supabase.rpc("admin_set_role", { _user: u.id, _role: r, _grant: !has }), "Roles updated")}>
                    {has ? `✓ ${r}` : `+ ${r}`}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {tab === "sellers" && (
        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {sellers.length === 0 && <p className="p-6 text-muted-foreground">No sellers yet.</p>}
          {sellers.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-4">
              <div className="flex-1"><div className="font-semibold">{s.store_name}</div><div className="text-xs text-muted-foreground">{s.products?.[0]?.count ?? 0} products · since {new Date(s.created_at).toLocaleDateString()}</div></div>
              <Button size="sm" variant={s.is_active ? "outline" : "default"} onClick={() => run(supabase.from("sellers").update({ is_active: !s.is_active }).eq("id", s.id), "Updated")}>
                {s.is_active ? "Suspend" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4">
              {p.image_url && <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
              <div className="flex-1"><div className="font-semibold">{p.name}</div><div className="text-xs text-muted-foreground">{p.sellers?.store_name || "bozor"} · {p.categories?.name} · {money(p.price)} · stock {p.stock}</div></div>
              <Button size="sm" variant="outline" onClick={() => run(supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id))}>{p.is_active ? "Hide" : "Show"}</Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && run(supabase.from("products").delete().eq("id", p.id), "Deleted")}>Delete</Button>
            </div>
          ))}
        </div>
      )}

      {tab === "categories" && (
        <div className="mt-8 space-y-4">
          <form className="flex gap-2" onSubmit={(e) => {
            e.preventDefault();
            const slug = newCat.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
            run(supabase.from("categories").insert({ name: newCat.trim(), slug }), "Category added");
            setNewCat("");
          }}>
            <input required value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className={field} />
            <Button type="submit">Add</Button>
          </form>
          <div className="divide-y rounded-2xl border bg-card">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && run(supabase.from("categories").update({ name: e.target.value }).eq("id", c.id), "Renamed")} className={`${field} flex-1`} />
                <span className="text-xs text-muted-foreground">{c.products?.[0]?.count ?? 0} products</span>
                <Button size="sm" variant="ghost" onClick={() => confirm("Delete category?") && run(supabase.from("categories").delete().eq("id", c.id), "Deleted")}>Delete</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && <OrdersTable orders={orders} onOpen={setOpenOrder} />}

      <Dialog open={!!openOrder} onOpenChange={(o) => !o && setOpenOrder(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="sr-only">Order</DialogTitle>
          {openOrder && <OrderDetail id={openOrder} mode="manager" onChange={load} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
