import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "@/components/ProductForm";
import { OrderDetail } from "@/components/OrderDetail";
import { OrdersTable } from "@/components/OrdersTable";
import { Stat, Tabs } from "@/components/Stat";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller dashboard — bozor" }, { name: "description", content: "Manage your store products, orders and revenue." }, { property: "og:title", content: "Seller dashboard — bozor" }, { property: "og:description", content: "Manage your store." }] }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const { user, isSeller, loading } = useAuth();
  const [seller, setSeller] = useState(null);
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [openOrder, setOpenOrder] = useState(null);

  const load = async (sid) => {
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from("products").select("*, categories(name)").eq("seller_id", sid).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(product_name, quantity, price)").eq("seller_id", sid).order("created_at", { ascending: false }),
    ]);
    setProducts(p || []);
    setOrders(o || []);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("categories").select("*").order("name").then(({ data }) => setCats(data || []));
    supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setSeller(data);
      if (data) load(data.id);
    });
  }, [user]);

  if (loading) return null;
  if (!isSeller) return <div className="container-page py-20 text-center">This area is for sellers. <Link to="/sell" className="text-primary underline">Become a seller</Link></div>;
  if (!seller) return <div className="container-page py-20 text-muted-foreground">Loading store…</div>;

  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
  const pipeline = valid.filter((o) => o.status !== "delivered").reduce((s, o) => s + Number(o.total), 0);
  const unitsSold = valid.flatMap((o) => o.order_items).reduce((s, i) => s + i.quantity, 0);
  const byDay = {};
  valid.forEach((o) => { const d = o.created_at.slice(0, 10); byDay[d] = (byDay[d] || 0) + Number(o.total); });
  const chart = Object.entries(byDay).sort().slice(-14).map(([day, total]) => ({ day: day.slice(5), total }));
  const best = {};
  valid.flatMap((o) => o.order_items).forEach((i) => { best[i.product_name] = (best[i.product_name] || 0) + i.quantity; });

  const saveProduct = async (data) => {
    const payload = { name: data.name, description: data.description, price: data.price, stock: data.stock, image_url: data.image_url, category_id: data.category_id || null, is_active: data.is_active, seller_id: seller.id };
    const { error } = editing?.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Product saved");
    setEditing(null);
    load(seller.id);
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Seller dashboard</p>
          <h1 className="text-4xl font-extrabold">{seller.store_name}</h1>
        </div>
        <Tabs tabs={["overview", "products", "orders"]} value={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Revenue" value={money(revenue)} hint="Delivered orders" />
            <Stat label="In pipeline" value={money(pipeline)} hint="Not yet delivered" />
            <Stat label="Sales" value={valid.length} hint={`${unitsSold} units`} />
            <Stat label="Products" value={products.length} hint={`${products.filter((p) => p.stock === 0).length} out of stock`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border bg-card p-5">
              <b>Sales by day</b>
              <div className="mt-4 h-64">
                <ResponsiveContainer>
                  <BarChart data={chart}><XAxis dataKey="day" fontSize={12} /><YAxis fontSize={12} /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <b>Best sellers</b>
              <ul className="mt-4 space-y-2 text-sm">
                {Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n, q]) => <li key={n} className="flex justify-between"><span>{n}</span><b>{q}</b></li>)}
                {!Object.keys(best).length && <li className="text-muted-foreground">No sales yet</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="mt-8 space-y-4">
          {editing ? (
            <ProductForm initial={editing.id ? editing : null} categories={cats} onSave={saveProduct} onCancel={() => setEditing(null)} />
          ) : (
            <Button onClick={() => setEditing({})}>+ New product</Button>
          )}
          <div className="divide-y rounded-2xl border bg-card">
            {products.length === 0 && <p className="p-6 text-muted-foreground">No products yet.</p>}
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                {p.image_url && <img src={p.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                <div className="flex-1">
                  <div className="font-semibold">{p.name} {!p.is_active && <span className="text-xs text-muted-foreground">(hidden)</span>}</div>
                  <div className="text-xs text-muted-foreground">{p.categories?.name} · {money(p.price)} · stock {p.stock}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  if (!confirm("Delete product?")) return;
                  const { error } = await supabase.from("products").delete().eq("id", p.id);
                  error ? toast.error(error.message) : load(seller.id);
                }}>Delete</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && <OrdersTable orders={orders} onOpen={setOpenOrder} />}

      <Dialog open={!!openOrder} onOpenChange={(o) => !o && setOpenOrder(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="sr-only">Order</DialogTitle>
          {openOrder && <OrderDetail id={openOrder} mode="manager" onChange={() => load(seller.id)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

