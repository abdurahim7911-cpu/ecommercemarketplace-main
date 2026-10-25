import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProductForm({ initial, categories, onSave, onCancel }) {
  const [f, setF] = useState(
    initial || { name: "", description: "", price: "", stock: "", image_url: "", category_id: categories[0]?.id || "", is_active: true },
  );
  const field = "h-10 w-full rounded-lg border bg-background px-3 text-sm";
  return (
    <form
      className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...f, price: Number(f.price), stock: Number(f.stock) });
      }}
    >
      <input required placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
      <select value={f.category_id || ""} onChange={(e) => setF({ ...f, category_id: e.target.value })} className={field}>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input required type="number" step="0.01" min="0" placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={field} />
      <input required type="number" min="0" placeholder="Stock" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} className={field} />
      <input placeholder="Image URL" value={f.image_url || ""} onChange={(e) => setF({ ...f, image_url: e.target.value })} className={`${field} sm:col-span-2`} />
      <textarea placeholder="Description" value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} className="rounded-lg border bg-background p-3 text-sm sm:col-span-2" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Visible in shop</label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
