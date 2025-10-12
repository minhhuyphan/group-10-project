import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from './api';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
  const res = await api.post('/auth/reset-password', { token, newPassword: password });
      setMessage(res.data?.message || 'Mật khẩu đã được thay đổi');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  // Prefill token from query string if present
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, [location.search]);

  return (
    <div className="card" style={{ maxWidth: 480, margin: '20px auto' }}>
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
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary create-btn" type="submit" disabled={loading}>
            {loading ? 'Đang...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
};

export default ResetPassword;
