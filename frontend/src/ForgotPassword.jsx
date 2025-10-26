import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [debugToken, setDebugToken] = useState(null);
  const navigate = useNavigate();

  const tryDirectBackend = async (email) => {
    // Fallback to direct backend URL (bypass CRA proxy) for debugging
    try {
      const res = await fetch('http://localhost:3001/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setDebugToken(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = res.data || {};
      setMessage(data.message || 'Yêu cầu đặt lại mật khẩu đã được gửi (nếu email tồn tại).');
      if (data.resetToken) {
        setDebugToken(data.resetToken);
        // auto-navigate to reset page with token for convenience in dev
        navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`);
      }
    } catch (err) {
      // Provide richer error info
      const resp = err.response;
      if (resp) {
        // Server responded with a status
        setMessage(`Error ${resp.status}: ${resp.data?.message || JSON.stringify(resp.data)}`);
      } else {
        // Network / proxy error: try direct backend call to see which side fails
        setMessage('Network Error when calling proxy. Trying direct backend...');
        const direct = await tryDirectBackend(email);
        if (direct.ok) {
          setMessage(direct.data?.message || 'Direct backend OK');
          if (direct.data?.resetToken) setDebugToken(direct.data.resetToken);
        } else {
          setMessage(`Direct backend failed: ${direct.error?.message || JSON.stringify(direct.error)}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '20px auto' }}>
      <h3>Quên mật khẩu</h3>
      <p>Nhập email của bạn để nhận token đặt lại mật khẩu.</p>
      <form onSubmit={handleSubmit} className="paypal-form">
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary create-btn" type="submit" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
      {debugToken && (
        <div style={{ marginTop: 12 }}>
          <strong>DEBUG resetToken:</strong>
          <div style={{ wordBreak: 'break-all', marginTop: 6 }}>{debugToken}</div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
