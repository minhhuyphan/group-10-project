import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signupThunk, clearError } from "./store/authSlice";

const SignUp = ({ onSwitchToLogin }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    dispatch(clearError());
    
    const result = await dispatch(signupThunk(form));
    
    if (signupThunk.fulfilled.match(result)) {
      setMessage("Đăng ký thành công. Bạn sẽ được chuyển sang trang đăng nhập...");
      setForm({ name: "", email: "", password: "" });
      // After short delay, switch to login form if provided
      setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin();
      }, 1500);
    } else {
      setMessage(result.payload || "Lỗi đăng ký");
    }
  };

  return (
    <div className="auth-portal center">
      <div className="paypal-card card">
        <div className="logo center">
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
          {message && <div className="message">{message}</div>}

          <input
            name="name"
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
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

          <div style={{display:'flex',justifyContent:'center'}}>
            <button
              className="btn btn-primary create-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang..." : "Create account"}
            </button>
          </div>

          <div className="or-row">
            <span></span>
            <small>or</small>
            <span></span>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onSwitchToLogin && onSwitchToLogin()}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
