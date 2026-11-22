import { supabase } from "../createClient";

export const toRupiah = (amount = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export function getImageUrl(path) {
  if (!path) return "/images/homebg.png";
  if (/^https?:\/\//i.test(path)) return path;
  // Mendukung data lama yang hanya menyimpan nama file pada folder images/.
  const storagePath = path.includes("/") ? path : `images/${path}`;
  return supabase.storage.from("coffee_images").getPublicUrl(storagePath).data.publicUrl;
}

export async function addCoffeeToCart(coffeeId, user) {
  if (!user) throw new Error("Silakan login untuk menambahkan produk ke keranjang.");
  const { error } = await supabase.rpc("kopi_add_to_cart", { p_coffee_id: Number(coffeeId) });
  if (error) throw error;
  window.dispatchEvent(new Event("coffeecart:updated"));
}
