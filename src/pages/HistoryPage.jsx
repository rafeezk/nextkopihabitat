import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../createClient";
import { useAuth } from "../auth/AuthProvider";
import { toRupiah } from "../lib/coffee";
import Swal from "sweetalert2";

function formatDate(isoDate) {
  const date = new Date(isoDate);
  // Format waktu Indonesia: HH:mm:ss DD-MM-YYYY.
  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date).replaceAll("/", "-");
  const timePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(date);
  return `${timePart} ${datePart}`;
}

export default function HistoryPage() {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from("coffeecheckout").select("*").order("created_at", { ascending: false });
    if (role !== "admin") query = query.eq("user_id", user.id);
    const { data, error } = await query;
    setLoading(false);
    if (error) return Swal.fire("Gagal membaca riwayat", error.message, "error");
    setOrders(data || []);
  }, [user, role]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  async function deleteOrder(orderId) {
    const { isConfirmed } = await Swal.fire({
      title: "Hapus riwayat?", icon: "warning", showCancelButton: true,
      confirmButtonText: "Ya, hapus", cancelButtonText: "Batal",
    });
    if (!isConfirmed) return;
    const { error } = await supabase.from("coffeecheckout").delete().eq("id", orderId);
    if (error) return Swal.fire("Gagal menghapus", error.message, "error");
    await loadOrders();
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] dark:bg-[#221f1f] p-5 md:p-10 text-black dark:text-white">
      <div className="flex gap-3 justify-between items-center mb-8">
        <h1 className="font-bold text-3xl">Transaction History</h1>
        <Link to="/profile" className="btn btn-outline dark:text-white">Profil</Link>
      </div>
      {loading && <p>Memuat riwayat...</p>}
      <div className="overflow-x-auto rounded-xl shadow bg-white dark:bg-black">
        <table className="table table-zebra text-center">
          <thead><tr>
            <th>No</th>{role === "admin" && <th>Pelanggan</th>}
            <th>Produk</th><th>Jumlah</th><th>Total</th><th>Waktu Checkout (WIB)</th>
            {role === "admin" && <th>Aksi</th>}
          </tr></thead>
          <tbody>
            {orders.map((order, idx) => <tr key={order.id}>
              <td>{idx + 1}</td>
              {role === "admin" && <td>{order.username}</td>}
              <td>{Array.isArray(order.coffee_name) ? order.coffee_name.join(", ") : order.coffee_name}</td>
              <td>{Array.isArray(order.items) ? order.items.reduce((n, p) => n + Number(p.quantity || 0), 0) : "-"}</td>
              <td>{toRupiah(order.price_total)}</td>
              <td>{formatDate(order.created_at)}</td>
              {role === "admin" && <td><button className="btn btn-sm btn-error text-white" onClick={() => void deleteOrder(order.id)}>Hapus</button></td>}
            </tr>)}
          </tbody>
        </table>
        {!loading && orders.length === 0 && <p className="text-center p-6">Belum ada transaksi.</p>}
      </div>
    </main>
  );
}
