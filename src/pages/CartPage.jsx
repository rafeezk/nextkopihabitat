import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../createClient";
import { getImageUrl, toRupiah } from "../lib/coffee";
import Swal from "sweetalert2";

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  async function loadCart() {
    if (!user) return;
    const { data, error } = await supabase
      .from("coffeecart")
      .select("id, id_user, id_product, cart_total, coffees (id, coffee_name, coffee_price, images)")
      .eq("id_user", user.id)
      .order("id");
    setLoading(false);
    if (error) {
      await Swal.fire("Gagal membaca keranjang", error.message, "error");
      return;
    }
    setItems(data || []);
  }

  useEffect(() => { void loadCart(); }, [user?.id]);

  const selectedItems = useMemo(() => items.filter((item) => checked[item.id]), [items, checked]);
  const total = useMemo(() => selectedItems.reduce((sum, item) =>
    sum + item.cart_total * (item.coffees?.coffee_price || 0), 0), [selectedItems]);

  async function updateQuantity(item, nextQty) {
    if (nextQty < 1 || nextQty > 99) return;
    const { error } = await supabase.from("coffeecart")
      .update({ cart_total: nextQty })
      .eq("id", item.id).eq("id_user", user.id);
    if (error) return Swal.fire("Gagal mengubah jumlah", error.message, "error");
    await loadCart();
    window.dispatchEvent(new Event("coffeecart:updated"));
  }

  async function deleteItem(itemId) {
    const { isConfirmed } = await Swal.fire({
      title: "Hapus dari keranjang?", icon: "question", showCancelButton: true,
      confirmButtonText: "Hapus", cancelButtonText: "Batal",
    });
    if (!isConfirmed) return;
    const { error } = await supabase.from("coffeecart").delete().eq("id", itemId).eq("id_user", user.id);
    if (error) return Swal.fire("Gagal menghapus", error.message, "error");
    setChecked((old) => ({ ...old, [itemId]: false }));
    await loadCart();
    window.dispatchEvent(new Event("coffeecart:updated"));
  }

  async function checkout(e) {
    e.preventDefault();
    if (!selectedItems.length || checkoutBusy) {
      if (!selectedItems.length) await Swal.fire("Pilih produk", "Centang item yang akan dibeli.", "warning");
      return;
    }
    setCheckoutBusy(true);
    // Fungsi Postgres akan memvalidasi pemilik item, menghitung total, membuat order,
    // dan menghapus item terkait dalam SATU transaksi.
    const { data: orderId, error } = await supabase.rpc("kopi_checkout_cart", {
      p_cart_ids: selectedItems.map((item) => item.id),
    });
    setCheckoutBusy(false);
    if (error) {
      await Swal.fire("Checkout gagal", error.message, "error");
      await loadCart();
      return;
    }
    window.dispatchEvent(new Event("coffeecart:updated"));
    await Swal.fire("Checkout berhasil", `Pesanan #${orderId} tersimpan di Supabase.`, "success");
    navigate("/history");
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] dark:bg-[#221f1f] p-5 md:p-10 pb-36 text-black dark:text-white">
      <h1 className="font-bold text-3xl mb-2 text-center">Shopping Cart</h1>
      <p className="text-center mb-8">Total item: {items.length}</p>
      {loading && <p className="text-center">Memuat keranjang...</p>}
      {!loading && items.length === 0 && <p className="text-center">Keranjang masih kosong. Tambahkan kopi dari halaman utama.</p>}
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        {items.map((item) => <article key={item.id}
          className="rounded-lg shadow-md bg-white dark:bg-black flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4">
          <input type="checkbox" aria-label={`Pilih ${item.coffees?.coffee_name || "kopi"}`}
            checked={Boolean(checked[item.id])}
            onChange={(e) => setChecked((old) => ({ ...old, [item.id]: e.target.checked }))}
            className="checkbox checkbox-neutral" />
          <img src={getImageUrl(item.coffees?.images)} alt={item.coffees?.coffee_name || "Kopi"}
            className="w-28 h-24 object-cover rounded" />
          <div className="flex-1 min-w-36">
            <h2 className="font-bold">{item.coffees?.coffee_name || "Produk tidak tersedia"}</h2>
            <p className="text-sm">Harga satuan: {toRupiah(item.coffees?.coffee_price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm" disabled={item.cart_total <= 1} onClick={() => void updateQuantity(item, item.cart_total - 1)}>-</button>
            <span className="w-8 text-center">{item.cart_total}</span>
            <button className="btn btn-sm" disabled={item.cart_total >= 99} onClick={() => void updateQuantity(item, item.cart_total + 1)}>+</button>
          </div>
          <strong className="min-w-28 text-right">{toRupiah((item.coffees?.coffee_price || 0) * item.cart_total)}</strong>
          <button onClick={() => void deleteItem(item.id)} className="btn btn-sm btn-error text-white">Hapus</button>
        </article>)}
      </div>
      <form onSubmit={checkout} className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black shadow-2xl border-t p-4 z-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div><span>Item terpilih: {selectedItems.length}</span><h2 className="text-xl font-bold">Total: {toRupiah(total)}</h2></div>
          <button type="submit" disabled={checkoutBusy || items.length === 0}
            className="btn btn-neutral w-full sm:w-52">{checkoutBusy ? "Memproses..." : "Checkout"}</button>
        </div>
      </form>
    </main>
  );
}
