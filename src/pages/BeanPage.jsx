import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../createClient";
import { getImageUrl, toRupiah } from "../lib/coffee";

export default function BeanPage() {
  const [beans, setBeans] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const perPage = 4;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: fetchError } = await supabase.from("beans").select("*").order("id");
      if (active) {
        setBeans(data || []);
        setError(fetchError?.message || "");
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section id="product" className="min-h-[650px] bg-[#F3F4F6] dark:bg-[#221f1f] py-12 px-5">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black dark:text-white">Special Roasted</h2>
        <p className="text-gray-500 mt-2">Pilihan biji kopi terbaik dari berbagai daerah Indonesia.</p>
      </div>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="flex flex-wrap justify-center gap-8">
        {beans.slice((page - 1) * perPage, page * perPage).map((bean) => (
          <article key={bean.id} className="card w-64 bg-white dark:bg-[#252525] shadow-xl">
            <img src={getImageUrl(bean.images)} alt={bean.name} className="h-44 object-cover rounded-t-lg" />
            <div className="card-body">
              <h3 className="card-title text-black dark:text-white">{bean.name}</h3>
              <div className="flex justify-between text-black dark:text-white text-sm">
                <span>{toRupiah(bean.price)}</span><span>{bean.weight}gr</span>
              </div>
              <Link to={`/detail/${bean.id}`} className="btn btn-outline dark:text-white mt-3">View details</Link>
            </div>
          </article>
        ))}
      </div>
      {!error && beans.length === 0 && <p className="text-center text-gray-500">Belum ada data biji kopi.</p>}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: Math.ceil(beans.length / perPage) }, (_, i) => (
          <button key={i} onClick={() => setPage(i + 1)}
            className={`btn btn-circle btn-sm ${page === i + 1 ? "btn-neutral" : "btn-outline"}`}>{i + 1}</button>
        ))}
      </div>
    </section>
  );
}
