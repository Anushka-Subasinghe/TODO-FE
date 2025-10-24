import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <button className="home-button" onClick={() => navigate("create")}>
        Create New Tasks
      </button>
      <button className="home-button" onClick={() => navigate("tasks")}>
        View Tasks
      </button>
    </div>
  );
};

export default HomePage;
