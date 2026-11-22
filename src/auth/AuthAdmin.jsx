import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function AuthAdmin() {
  const { user, role } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ path: location.pathname }} />;
  return role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}
