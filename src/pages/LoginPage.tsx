import { useForm, type SubmitHandler } from "react-hook-form";
import "./LoginPage.css";
import api from "../api/api";
import useAuth from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";
import toast from "react-hot-toast";

type LoginInputs = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();
  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const onSubmit = useCallback<SubmitHandler<LoginInputs>>(
    async (data) => {
      try {
        const res = await api.post("/auth/login", {
          email: data.email,
          password: data.password,
        });

        if (res.status === 200) {
          toast.success("Login successful!");

          const accessToken = res.data.accessToken;
          const id = res.data.id;
          localStorage.setItem("id", id);
          localStorage.setItem("accessToken", accessToken);
          setAuth({ accessToken });
          navigate(from, { replace: true });
        }
      } catch (error) {
        console.error(error);
        toast.error("Login failed. Please check your credentials.");
      }
    },
    [from, setAuth]
  );

  return (
    <div className="login-container">
      <h2 className="login-title">Sign In</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            {...register("email", { required: "Email is required" })}
            placeholder="Enter your email"
          />
          {errors.email && (
            <span className="error">{errors.email.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register("password", { required: "Password is required" })}
            placeholder="Enter your password"
          />
          {errors.password && (
            <span className="error">{errors.password.message}</span>
          )}
        </div>

        <button type="submit" className="submit-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
