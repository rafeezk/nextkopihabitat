import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../createClient";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let revision = 0;

    async function applyUser(currentUser) {
      const currentRevision = ++revision;
      if (!active) return;
      setUser(currentUser || null);
      if (!currentUser) {
        setUsername("");
        setRole("user");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (!active || currentRevision !== revision) return;
      if (error) console.error("Gagal memuat profil:", error.message);
      setUsername(data?.username || currentUser.email?.split("@")[0] || "User");
      setRole(data?.role || "user");
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Gagal mendapatkan user:", error.message);
      void applyUser(data?.user || null);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        void applyUser(null);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Tidak await operasi Supabase lain di dalam callback auth.
        setTimeout(() => void applyUser(session?.user || null), 0);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const logout = () => supabase.auth.signOut();
  return (
    <AuthContext.Provider value={{ user, username, role, loading, auth: Boolean(user), logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
