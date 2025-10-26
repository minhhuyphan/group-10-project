import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk, clearError } from "./store/authSlice";

const Login = ({ onSwitchToSignUp }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginThunk(form));
    
    // Nếu login thành công, redirect về trang trước đó hoặc home
    if (loginThunk.fulfilled.match(result)) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  // Auto-redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <div className="auth-portal center">
      <div className="paypal-card card">
        <div className="logo center">
          {/* Simple text logo; replace with image if needed */}
          <div style={{ textAlign: "center" }}>
            <div
              className="brand-logo"
              style={{ width: 90, height: 36, borderRadius: 6 }}
            >
              TAMTAI
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="paypal-form">
          {error && <div className="error-message">{error}</div>}

          <input
            name="email"
            type="text"
            placeholder="Email or mobile number"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-primary create-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang..." : "Log In"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              type="button"
              className="muted"
              onClick={() => navigate("/forgot-password")}
              style={{
                background: "none",
                border: "none",
                color: "#0070ba",
                cursor: "pointer",
                textDecoration: "none",
                fontSize: "inherit"
              }}
            >
              Quên mật khẩu?
            </button>
          </div>

          <div className="or-row">
            <span></span>
            <small>or</small>
            <span></span>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onSwitchToSignUp && onSwitchToSignUp()}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
