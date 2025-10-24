import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import api from "../api/api";
import toast from "react-hot-toast";

const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("id");
      toast.success("Logged out successfully!");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Logout failed");
    }
  };

  return (
    <div className="home-container">
      <button className="home-button" onClick={() => navigate("create")}>
        Create New Tasks
      </button>
      <button className="home-button" onClick={() => navigate("tasks")}>
        View Tasks
      </button>
      <button className="home-button logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default HomePage;
