import React, { useEffect, useState } from "react";
import api from "./api";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "./store/authSlice";

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    // If we already have a user in context, populate form
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        age: user.age || "",
        avatar: user.avatar || "",
      });
    } else {
      // otherwise fetch profile from API
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/profile");
      if (res.data && res.data.user) {
        const u = res.data.user;
        setForm({
          name: u.name || "",
          email: u.email || "",
          age: u.age || "",
          avatar: u.avatar || "",
        });
        setAvatarPreview(u.avatar || '');
        dispatch(setUser(u));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setValidationErrors([]);
    // Client-side validation
    const v = [];
    if (!form.name || form.name.trim().length < 2) v.push('Tên phải có ít nhất 2 ký tự');
    if (form.age !== '' && form.age !== null) {
      const a = Number(form.age);
      if (Number.isNaN(a) || a < 1 || a > 150) v.push('Tuổi phải là số trong khoảng 1-150');
    }
    if (v.length) {
      setValidationErrors(v);
      return;
    }
    setLoading(true);
    try {
      const payload = { name: form.name };
      if (form.age !== "") payload.age = form.age;
      if (form.avatar !== "") payload.avatar = form.avatar;

      const res = await api.put("/profile", payload);
      if (res.data && res.data.user) {
        setMessage("Cập nhật thông tin thành công");
        dispatch(setUser(res.data.user));
        setAvatarPreview(res.data.user.avatar || '');
      } else {
        setMessage(res.data?.message || "Đã cập nhật");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file input and convert to base64 for preview + send to server
  const handleAvatarFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarPreview(dataUrl);
      setForm(prev => ({ ...prev, avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-page card profile-card">
      <h2 className="profile-title">Trang Profile</h2>

      {loading && <div className="loading">Đang tải...</div>}
      {validationErrors.length > 0 && (
        <ul className="validation-list">
          {validationErrors.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="profile-grid">
        <div className="profile-left">
          <div className="avatar-wrap">
            <div className="avatar-frame">
              <img src={avatarPreview || form.avatar || '/logo192.png'} alt="avatar" className="avatar-large" />
            </div>
          </div>
          <div className="profile-email">
            <strong>Email:</strong>
            <div className="muted">{form.email}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form profile-right">
          <div className="form-row">
            <label>Tên</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label>Tuổi</label>
            <input name="age" type="number" value={form.age || ""} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label>Avatar (URL)</label>
            <input name="avatar" value={form.avatar} onChange={handleChange} placeholder="Hoặc dán URL ảnh" />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input name="email" value={form.email} readOnly />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
