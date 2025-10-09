import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

const Login = ({ onSwitchToSignUp }) => {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

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
            <a className="muted" href="#">
              Having trouble logging in?
            </a>
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
