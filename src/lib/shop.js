import { supabase } from "@/integrations/supabase/client";

export const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

export const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];

// Business rules (mirrors the database trigger)
export const NEXT_STATUS = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
};
export const canCancel = (status) => status === "pending" || status === "confirmed";

export async function getCartId(userId) {
  const { data } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function addToCart(userId, productId, qty = 1) {
  const cartId = await getCartId(userId);
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + qty })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, product_id: productId, quantity: qty });
    if (error) throw error;
  }
  window.dispatchEvent(new Event("cart-changed"));
}

export async function toggleWishlist(userId, productId) {
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (data) {
    await supabase.from("wishlists").delete().eq("id", data.id);
    return false;
  }
  await supabase.from("wishlists").insert({ user_id: userId, product_id: productId });
  return true;
}
