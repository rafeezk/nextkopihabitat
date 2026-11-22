import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../createClient";
import { getImageUrl, toRupiah } from "../lib/coffee";

export default function BeanDetail() {
  const { id } = useParams();
  const [bean, setBean] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: queryError } = await supabase.from("beans").select("*").eq("id", id).maybeSingle();
      if (active) {
        setBean(data);
        setError(queryError?.message || "");
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F3F4F6] dark:bg-[#221f1f] pt-28 px-5 pb-10">
        {loading && <p className="text-center">Memuat detail...</p>}
        {!loading && !bean && <p className="text-center text-red-600">{error || "Biji kopi tidak ditemukan."}</p>}
        {bean && <div className="card lg:card-side max-w-6xl mx-auto bg-white dark:bg-[#252525] shadow-xl">
          <figure className="lg:w-1/2"><img src={getImageUrl(bean.images)} alt={bean.name} className="object-cover w-full h-80 lg:h-full" /></figure>
          <div className="card-body lg:w-1/2 text-black dark:text-white">
            <h1 className="text-4xl font-bold">{bean.name}</h1>
            <p className="mt-4">{bean.description}</p>
            <div className="mt-5 space-y-2">
              <p><strong>Asal:</strong> {bean.region}</p>
              <p><strong>Profil rasa:</strong> {bean.flavor_profile}</p>
              <p><strong>Roast level:</strong> {bean.roast_level}</p>
              <p><strong>Opsi giling:</strong> {(bean.grind_option || []).join(", ") || "-"}</p>
              <p><strong>Berat:</strong> {bean.weight} gram</p>
            </div>
            <p className="text-3xl font-bold mt-8">{toRupiah(bean.price)}</p>
            <p className="font-semibold">HANYA TERSEDIA DI TOKO OFFLINE.</p>
            <Link className="btn btn-neutral mt-3" to="/">Kembali</Link>
          </div>
        </div>}
      </main>
    </>
  );
}
