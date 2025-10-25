import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (password.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, {
        newPassword: password,
      });
      setMessage(
        res.data?.message ||
          "Mật khẩu đã được thay đổi thành công! Đang chuyển về trang đăng nhập..."
      );
      setTimeout(() => {

        navigate("/");
        navigate('/');
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  // Prefill token from query string if present
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, [location.search]);

  return (
    <div className="card" style={{ maxWidth: 480, margin: "20px auto" }}>
      <h3>Đổi mật khẩu bằng token</h3>
      <form onSubmit={handleSubmit} className="paypal-form">
        <input
          name="token"
          type="text"
          placeholder="Token đặt lại"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <input
          name="confirmPassword"
          type="password"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          style={{
            borderColor:
              confirmPassword && password !== confirmPassword ? "#d32f2f" : "",
          }}
        />

        {confirmPassword && password !== confirmPassword && (
          <div
            style={{
              color: "#d32f2f",
              fontSize: "14px",
              marginTop: "-8px",
              marginBottom: "8px",
            }}
          >
            ⚠️ Mật khẩu xác nhận không khớp
          </div>
        )}
        {confirmPassword &&
          password === confirmPassword &&
          confirmPassword.length >= 6 && (
            <div
              style={{
                color: "#2e7d32",
                fontSize: "14px",
                marginTop: "-8px",
                marginBottom: "8px",
              }}
            >
              ✓ Mật khẩu khớp
            </div>
          )}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            className="btn btn-primary create-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Đang..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
};

export default ResetPassword;
