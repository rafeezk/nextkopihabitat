import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../createClient";
import Swal from "sweetalert2";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      await Swal.fire("Registrasi gagal", "Konfirmasi password tidak cocok.", "warning");
      return;
    }
    if (form.password.length < 6) {
      await Swal.fire("Registrasi gagal", "Password minimal 6 karakter.", "warning");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { username: form.username.trim() } },
    });
    setLoading(false);
    if (error) {
      await Swal.fire("Registrasi gagal", error.message, "error");
      return;
    }
    // Trigger database otomatis membuat row di public.profiles.
    await Swal.fire(
      "Registrasi berhasil",
      data.session ? "Akun siap digunakan." : "Periksa email untuk konfirmasi akun, lalu login.",
      "success"
    );
    navigate(data.session ? "/" : "/login", { replace: true });
  }

  return (
    <section className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-[#282726] p-8 shadow-xl">
        <h1 className="text-white text-2xl font-bold text-center mb-7">Daftar Kopi Habitat</h1>
        {[
          ["username", "Username", "text"], ["email", "Email", "email"],
          ["password", "Password", "password"], ["confirm", "Konfirmasi Password", "password"],
        ].map(([name, placeholder, type]) => (
          <input key={name} name={name} type={type} required minLength={name === "username" ? 2 : undefined}
            value={form[name]} onChange={handleChange} placeholder={placeholder}
            className="input input-bordered w-full bg-black text-white mb-4" />
        ))}
        <button type="submit" disabled={loading || !form.username.trim()} className="btn bg-white text-black w-full mt-4">
          {loading ? "Memproses..." : "Register"}
        </button>
        <p className="text-white text-sm text-center mt-5">
          Sudah punya akun? <Link to="/login" className="text-blue-400">Login</Link>
        </p>
      </form>
    </section>
  );
}
