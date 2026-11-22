import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../createClient";
import { getImageUrl, toRupiah } from "../lib/coffee";
import Swal from "sweetalert2";

const EMPTY_COFFEE = {
  coffee_name: "", coffee_description: "", coffee_ingredients: "", coffee_price: "", images: "",
};
const EMPTY_BEAN = {
  name: "", description: "", price: "", weight: "250", region: "",
  flavor_profile: "", roast_level: "", grind_option: "Whole bean, Medium", images: "",
};

export default function ListData() {
  const [type, setType] = useState("coffees");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_COFFEE);
  const [imageFile, setImageFile] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(type).select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) await Swal.fire("Gagal memuat data", error.message, "error");
    setItems(data || []);
  }, [type]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  function changeType(nextType) {
    setType(nextType);
    resetForm(nextType);
  }

  function resetForm(forType = type) {
    setEditingId(null);
    setForm(forType === "coffees" ? { ...EMPTY_COFFEE } : { ...EMPTY_BEAN });
    setImageFile(null);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setImageFile(null);
    setForm(type === "beans" ? {
      ...item,
      grind_option: (item.grind_option || []).join(", "),
    } : { ...item });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeForm(e) { setForm((old) => ({ ...old, [e.target.name]: e.target.value })); }

  async function uploadImage(file) {
    if (!file) return null;
    if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      throw new Error("Gunakan gambar JPG, PNG, WEBP, atau GIF.");
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${type === "beans" ? "beans" : "coffee"}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("coffee_images").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return path;
  }

  async function saveItem(e) {
    e.preventDefault();
    if (busy) return;
    if (!editingId && !imageFile) {
      await Swal.fire("Gambar wajib diisi", "Pilih foto produk saat menambah data.", "warning");
      return;
    }
    setBusy(true);
    let newImagePath = null;
    try {
      if (imageFile) newImagePath = await uploadImage(imageFile);
      const payload = type === "coffees" ? {
        coffee_name: form.coffee_name.trim(),
        coffee_description: form.coffee_description.trim(),
        coffee_ingredients: form.coffee_ingredients.trim(),
        coffee_price: Number(form.coffee_price),
        images: newImagePath || form.images || null,
      } : {
        name: form.name.trim(), description: form.description.trim(),
        price: Number(form.price), weight: Number(form.weight),
        region: form.region.trim(), flavor_profile: form.flavor_profile.trim(),
        roast_level: form.roast_level.trim(),
        grind_option: form.grind_option.split(",").map((x) => x.trim()).filter(Boolean),
        images: newImagePath || form.images || null,
      };
      if (type === "beans" && payload.weight <= 0) throw new Error("Berat harus lebih dari 0 gram.");
      if ((type === "beans" ? payload.price : payload.coffee_price) < 0) throw new Error("Harga tidak boleh negatif.");

      const query = editingId
        ? supabase.from(type).update(payload).eq("id", editingId)
        : supabase.from(type).insert(payload);
      const { error } = await query;
      if (error) throw error;

      if (newImagePath && form.images) {
        const oldPath = form.images.includes("/") ? form.images : `images/${form.images}`;
        const { error: oldFileError } = await supabase.storage.from("coffee_images").remove([oldPath]);
        if (oldFileError) console.warn("Foto lama belum terhapus:", oldFileError.message);
      }
      resetForm();
      await loadItems();
      await Swal.fire("Berhasil", "Data tersimpan di Supabase.", "success");
    } catch (error) {
      if (newImagePath) {
        await supabase.storage.from("coffee_images").remove([newImagePath]);
      }
      await Swal.fire("Gagal menyimpan", error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item) {
    const { isConfirmed } = await Swal.fire({
      title: "Hapus produk?", text: "Produk akan dihapus dari database.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Ya, hapus", cancelButtonText: "Batal",
    });
    if (!isConfirmed) return;
    const { error } = await supabase.from(type).delete().eq("id", item.id);
    if (error) return Swal.fire("Gagal menghapus", error.message, "error");
    if (item.images && !/^https?:\/\//i.test(item.images)) {
      const path = item.images.includes("/") ? item.images : `images/${item.images}`;
      const { error: storageError } = await supabase.storage.from("coffee_images").remove([path]);
      if (storageError) console.warn("Foto belum terhapus:", storageError.message);
    }
    await loadItems();
    await Swal.fire("Terhapus", "Data berhasil dihapus.", "success");
  }

  const fields = type === "coffees" ? [
    ["coffee_name", "Nama kopi", "text"],
    ["coffee_description", "Deskripsi", "textarea"],
    ["coffee_ingredients", "Komposisi", "text"],
    ["coffee_price", "Harga (Rp)", "number"],
  ] : [
    ["name", "Nama biji kopi", "text"],
    ["description", "Deskripsi", "textarea"],
    ["price", "Harga (Rp)", "number"],
    ["weight", "Berat (gram)", "number"],
    ["region", "Asal daerah", "text"],
    ["flavor_profile", "Profil rasa", "text"],
    ["roast_level", "Tingkat roasting", "text"],
    ["grind_option", "Opsi giling (pisahkan koma)", "text"],
  ];

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-black p-5 md:p-10">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Admin Kopi Habitat</h1>
        <Link to="/profile" className="btn btn-outline">Kembali ke profil</Link>
      </div>
      <div className="flex gap-3 mb-6">
        <button className={`btn ${type === "coffees" ? "btn-neutral" : "btn-outline"}`} onClick={() => changeType("coffees")}>Minuman kopi</button>
        <button className={`btn ${type === "beans" ? "btn-neutral" : "btn-outline"}`} onClick={() => changeType("beans")}>Biji kopi</button>
      </div>
      <form onSubmit={saveItem} className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{editingId ? "Edit" : "Tambah"} {type === "coffees" ? "minuman kopi" : "biji kopi"}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(([name, label, kind]) => (
            <label key={name} className="form-control">
              <span className="font-semibold mb-1">{label}</span>
              {kind === "textarea" ? (
                <textarea name={name} value={form[name] ?? ""} onChange={changeForm} required rows="3" className="textarea textarea-bordered" />
              ) : (
                <input name={name} value={form[name] ?? ""} onChange={changeForm}
                  type={kind} min={kind === "number" ? "0" : undefined}
                  required className="input input-bordered" />
              )}
            </label>
          ))}
          <label className="form-control">
            <span className="font-semibold mb-1">Foto {editingId ? "(opsional jika tidak diganti)" : "(wajib)"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="file-input file-input-bordered w-full" />
            {form.images && <img src={getImageUrl(form.images)} alt="Gambar tersimpan" className="mt-2 h-24 w-28 object-cover rounded" />}
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button type="submit" disabled={busy} className="btn btn-success text-white">{busy ? "Menyimpan..." : "Simpan ke Supabase"}</button>
          <button type="button" onClick={() => resetForm()} className="btn btn-outline">Batal / Kosongkan</button>
        </div>
      </form>
      <h2 className="text-xl font-bold mb-3">Daftar {type === "coffees" ? "minuman kopi" : "biji kopi"} ({items.length})</h2>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="table table-zebra">
          <thead><tr><th>No</th><th>Foto</th><th>Nama</th><th>Deskripsi</th><th>Harga</th><th>Aksi</th></tr></thead>
          <tbody>
            {items.map((item, idx) => <tr key={item.id}>
              <td>{idx + 1}</td>
              <td><img src={getImageUrl(item.images)} className="w-16 h-14 object-cover rounded" alt={item.coffee_name || item.name} /></td>
              <td>{item.coffee_name || item.name}</td>
              <td className="max-w-xs truncate">{item.coffee_description || item.description}</td>
              <td>{toRupiah(item.coffee_price ?? item.price)}</td>
              <td><div className="flex gap-2">
                <button className="btn btn-sm btn-primary text-white" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn-sm btn-error text-white" onClick={() => void deleteItem(item)}>Hapus</button>
              </div></td>
            </tr>)}
          </tbody>
        </table>
        {!loading && items.length === 0 && <p className="p-6 text-center">Belum ada data. Tambahkan produk melalui formulir.</p>}
        {loading && <p className="p-6">Memuat data...</p>}
      </div>
    </main>
  );
}
