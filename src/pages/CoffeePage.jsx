import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../createClient";
import { useAuth } from "../auth/AuthProvider";
import { addCoffeeToCart, getImageUrl, toRupiah } from "../lib/coffee";
import Swal from "sweetalert2";

export default function CoffeePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coffees, setCoffees] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const perPage = 4;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: queryError } = await supabase.from("coffees").select("*").order("id");
      if (active) {
        setCoffees(data || []);
        setError(queryError?.message || "");
      }
    })();
    return () => { active = false; };
  }, []);

  async function addCart(coffeeId) {
    if (!user) { navigate("/login", { state: { path: "/" } }); return; }
    try {
      await addCoffeeToCart(coffeeId, user);
      await Swal.fire("Berhasil", "Kopi ditambahkan ke keranjang.", "success");
    } catch (error) {
      await Swal.fire("Gagal", error.message, "error");
    }
  }

  return (
    <section className="min-h-[650px] bg-[#F3F4F6] dark:bg-[#221f1f] py-12 px-5" id="coffee">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black dark:text-white">Special Coffee</h2>
        <p className="text-gray-500 mt-2">Temukan menu kopi favoritmu.</p>
      </div>
      {error && <p className="text-center text-red-600">{error}</p>}
      <div className="flex flex-wrap justify-center gap-8">
        {coffees.slice((page - 1) * perPage, page * perPage).map((coffee) => (
          <article key={coffee.id} className="card w-64 bg-white dark:bg-[#252525] shadow-xl">
            <Link to={`/coffee-detail/${coffee.id}`}>
              <img src={getImageUrl(coffee.images)} className="h-44 w-full object-cover rounded-t-lg" alt={coffee.coffee_name} />
            </Link>
            <div className="card-body text-black dark:text-white">
              <h3 className="card-title">{coffee.coffee_name}</h3>
              <p>{toRupiah(coffee.coffee_price)}</p>
              <div className="flex gap-2 mt-3">
                <Link to={`/coffee-detail/${coffee.id}`} className="btn btn-outline flex-1 dark:text-white">Detail</Link>
                <button className="btn btn-neutral" title="Tambah ke keranjang" onClick={() => void addCart(coffee.id)}>+ Cart</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!error && coffees.length === 0 && <p className="text-center text-gray-500">Belum ada minuman kopi.</p>}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: Math.ceil(coffees.length / perPage) }, (_, i) => (
          <button key={i} onClick={() => setPage(i + 1)}
            className={`btn btn-circle btn-sm ${page === i + 1 ? "btn-neutral" : "btn-outline"}`}>{i + 1}</button>
        ))}
      </div>
    </section>
  );
}
