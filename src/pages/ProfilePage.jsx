import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const { user, username, role, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await logout();
    if (error) return Swal.fire("Gagal logout", error.message, "error");
    navigate("/", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] dark:bg-[#221f1f] text-black dark:text-white">
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <img src="/images/profilebg.png" alt="Background profil" className="w-full h-64 object-cover rounded-2xl shadow-lg" />
        <div className="text-center -mt-14 relative">
          <img src="/images/profile.png" alt="Avatar" className="rounded-full h-32 w-32 mx-auto border-4 border-white object-cover" />
          <h1 className="font-bold text-2xl mt-3">{username}</h1>
          <p className="text-sm">{user?.email}</p>
          <p className="capitalize">Role: {role}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/" className="btn btn-outline dark:text-white">Beranda</Link>
            <Link to="/history" className="btn btn-outline dark:text-white">Riwayat</Link>
            {role === "admin" && <Link to="/admin" className="btn btn-neutral">Kelola Produk</Link>}
            <button onClick={() => void handleLogout()} className="btn btn-error text-white">Logout</button>
          </div>
        </div>
      </div>
    </main>
  );
}
