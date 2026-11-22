import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../createClient";

export default function Navbar({ transparent = false }) {
  const { user, username, role, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", theme);
    setDarkMode(theme === "dark");
  }, []);

  function toggleTheme() {
    const next = darkMode ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.body.setAttribute("data-theme", next);
    setDarkMode(!darkMode);
  }

  useEffect(() => {
    if (!user) { setCartCount(0); return; }
    let active = true;
    async function refresh() {
      const { count, error } = await supabase.from("coffeecart")
        .select("*", { count: "exact", head: true }).eq("id_user", user.id);
      if (active && !error) setCartCount(count || 0);
    }
    void refresh();
    window.addEventListener("coffeecart:updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("coffeecart:updated", refresh);
    };
  }, [user]);

  async function handleLogout() {
    const { error } = await logout();
    if (error) { alert(error.message); return; }
    navigate("/");
  }

  return (
    <header className={`navbar z-20 w-full px-4 md:px-8 ${transparent
      ? "absolute bg-transparent text-white"
      : "relative border-b bg-white dark:bg-black text-black dark:text-white"}`}>
      <div className="navbar-start">
        <Link to="/" className="font-bold text-lg md:text-xl italic">kopihabitat.</Link>
      </div>
      <div className="navbar-center hidden md:flex gap-6 font-medium">
        <Link to="/" className="hover:underline">Home</Link>
        <a href="/#product" className="hover:underline">Beans</a>
        <a href="/#coffee" className="hover:underline">Coffee</a>
        <a href="/#location" className="hover:underline">Location</a>
      </div>
      <div className="navbar-end gap-2">
        <button type="button" onClick={toggleTheme} title="Ubah tema terang/gelap"
          className="btn btn-ghost btn-sm" aria-label="Ganti tema">{darkMode ? "☀" : "☾"}</button>
        {user ? <>
          <span className="hidden lg:inline text-sm">Hi, {username}!</span>
          <Link to="/cart" title="Keranjang" className="btn btn-ghost btn-circle relative" aria-label="Buka keranjang">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l2 12h12l2-9H6M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2m10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
            </svg>
            <span className="badge badge-sm absolute -top-1 -right-1">{cartCount}</span>
          </Link>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-sm btn-ghost">Akun ▾</button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-white dark:bg-[#222] text-black dark:text-white rounded-box w-44">
              <li><Link to="/profile">Profil</Link></li>
              <li><Link to="/history">Riwayat</Link></li>
              {role === "admin" && <li><Link to="/admin">Admin</Link></li>}
              <li><button onClick={() => void handleLogout()}>Logout</button></li>
            </ul>
          </div>
        </> : <Link to="/login" className="btn btn-sm bg-white text-black border border-black">Login</Link>}
      </div>
    </header>
  );
}
