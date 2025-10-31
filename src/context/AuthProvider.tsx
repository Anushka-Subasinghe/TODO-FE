import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import api from "../api/api";

/* ---------- Types ---------- */

interface AuthState {
  accessToken?: string;
}

interface AuthContextType {
  auth: AuthState | null;
  setAuth: Dispatch<SetStateAction<AuthState | null>>;
  accessToken: string | null;
  setAccessToken: Dispatch<SetStateAction<string | null>>;
}

/* ---------- Context ---------- */

// 👇 Initialize context with proper type — undefined forces provider usage
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------- Provider ---------- */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );

  // Refresh token if no access token exists
  const refreshAccessToken = async () => {
    try {
      const res = await api.post(
        "/auth/refresh",
        {},
        { withCredentials: true }
      );
      if (res.status === 200 && res.data.accessToken) {
        const token = res.data.accessToken;
        localStorage.setItem("accessToken", token);
        setAuth({ accessToken: token });
        setAccessToken(token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("🔄 Access token refreshed automatically");
      }
    } catch (err) {
      console.error("Failed to refresh access token:", err);
      setAuth(null);
      setAccessToken(null);
      localStorage.removeItem("accessToken");
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
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, accessToken, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
