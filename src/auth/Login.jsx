import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../createClient";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      await Swal.fire("Login gagal", error.message, "error");
      return;
    }
    navigate(location.state?.path || "/", { replace: true });
  }

  return (
    <section className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-[#282726] p-8 shadow-xl">
        <h1 className="text-white font-bold text-2xl text-center mb-8">Login Kopi Habitat</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" className="input input-bordered w-full bg-black text-white mb-4" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" className="input input-bordered w-full bg-black text-white mb-4" />
        <button disabled={loading} className="btn bg-white text-black w-full mt-4" type="submit">
          {loading ? "Memproses..." : "Login"}
        </button>
        <p className="text-center text-white mt-5 text-sm">
          Belum punya akun? <Link to="/register" className="text-blue-400">Daftar</Link>
        </p>
      </form>
    </section>
  );
}
