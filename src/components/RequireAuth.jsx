import { useEffect, useState } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../api/api";

const RequireAuth = () => {
  const { auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!auth?.accessToken) {
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
