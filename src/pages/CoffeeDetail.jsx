import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../createClient";
import { useAuth } from "../auth/AuthProvider";
import { addCoffeeToCart, getImageUrl, toRupiah } from "../lib/coffee";
import Swal from "sweetalert2";

export default function CoffeeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coffee, setCoffee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: queryError } = await supabase.from("coffees").select("*").eq("id", id).maybeSingle();
      if (active) {
        setCoffee(data);
        setError(queryError?.message || "");
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  async function addCart(buyNow = false) {
    if (!user) {
      navigate("/login", { state: { path: `/coffee-detail/${id}` } });
      return;
    }
    try {
      await addCoffeeToCart(coffee.id, user);
      if (buyNow) navigate("/cart");
      else await Swal.fire("Berhasil", "Kopi ditambahkan ke keranjang.", "success");
    } catch (err) {
      await Swal.fire("Gagal menambahkan kopi", err.message, "error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F3F4F6] dark:bg-[#221f1f] pt-28 px-4 pb-10">
        {loading && <p className="text-center">Memuat detail...</p>}
        {!loading && !coffee && <p className="text-center text-red-600">{error || "Kopi tidak ditemukan."}</p>}
        {coffee && <div className="card lg:card-side max-w-6xl mx-auto shadow-xl bg-white dark:bg-black text-black dark:text-white">
          <figure className="lg:w-1/2">
            <img src={getImageUrl(coffee.images)} alt={coffee.coffee_name} className="object-cover w-full h-80 lg:h-full" />
          </figure>
          <div className="card-body lg:w-1/2">
            <h1 className="text-3xl font-bold">{coffee.coffee_name}</h1>
            <p className="mt-3 leading-relaxed">
              {showFull || coffee.coffee_description.length <= 150
                ? coffee.coffee_description : `${coffee.coffee_description.slice(0, 150)}...`}
              {!showFull && coffee.coffee_description.length > 150 &&
                <button className="ml-2 text-blue-500" onClick={() => setShowFull(true)}>Selengkapnya</button>}
            </p>
            <p><strong>Komposisi:</strong> {coffee.coffee_ingredients}</p>
            <p className="text-3xl font-bold mt-8">{toRupiah(coffee.coffee_price)}</p>
            <div className="flex mt-6 gap-3">
              <button className="btn btn-outline flex-1 dark:text-white" onClick={() => void addCart(true)}>Buy</button>
              <button className="btn btn-neutral flex-1" onClick={() => void addCart(false)}>+ Cart</button>
            </div>
          </div>
        </div>}
      </main>
    </>
  );
}
