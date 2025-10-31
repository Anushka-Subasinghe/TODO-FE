import { useEffect, useState } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  sub: string;
}

const RequireAuth = () => {
  const { auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isTokenExpired = (token: string) => {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true; // invalid or malformed token
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // if no token or it's expired → refresh
        if (!auth?.accessToken || isTokenExpired(auth.accessToken)) {
          const res = await api.post(
            "/auth/refresh",
            {},
            { withCredentials: true }
          );
          const accessToken = res.data.accessToken;
          setAuth({ accessToken });
        }
      } catch (err) {
        console.error("Auth refresh failed:", err);
        setAuth(null);
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [auth, setAuth]);

  if (loading) return <div>Loading...</div>;

  return auth?.accessToken ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequireAuth;
