import { createContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({});

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  const refreshAccessToken = async () => {
    try {
      const res = await api.post("/auth/refresh");
      if (res.status === 200 && res.data.accessToken) {
        const token = res.data.accessToken;
        localStorage.setItem("accessToken", token);
        setAuth({ accessToken: token });
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("🔄 Access token refreshed automatically");
      }
    } catch (err) {
      console.error("Failed to refresh access token:", err);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      refreshAccessToken();
    } else {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setAuth({ accessToken });
      localStorage.setItem("accessToken", accessToken);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, accessToken, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
