import React, { useState, useRef, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';

const UploadAvatar = () => {
  const { user, setUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return setMessage('Chưa chọn ảnh');
    setLoading(true);
    setMessage(null);
    setProgress(0);
    try {
      const form = new FormData();
      form.append('avatar', file);

      const res = await api.post('/users/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            const p = Math.round((evt.loaded * 100) / evt.total);
            setProgress(p);
          }
        }
      });

      const data = res.data || {};
      const updatedUser = data.data?.user;
      const avatarUrl = data.data?.avatarUrl;
      if (updatedUser) {
        setUser && setUser(updatedUser);
      }
      if (avatarUrl) {
        setPreview(avatarUrl);
      }
      setMessage(data.message || 'Upload thành công');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setMessage('Bạn cần đăng nhập để upload avatar');
      } else {
        setMessage(err.response?.data?.message || err.message || 'Lỗi');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: '20px auto' }}>
      <h3>Upload Avatar (Cloudinary)</h3>
      {!user && (
        <div style={{ marginBottom: 10, color: '#b91c1c' }}>
          Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng tính năng này.
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 12, marginTop: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
      )}
      {loading && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>
          Đang tải lên... {progress ? `${progress}%` : ''}
        </div>
      )}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'Đang upload...' : 'Upload'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setFile(null); setPreview(null); setMessage(null); }} disabled={loading}>
          Xoá chọn
        </button>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
};

export default UploadAvatar;
