import React, { useState, useRef } from 'react';
import api from './api';

const UploadAvatar = () => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return setMessage('Chưa chọn ảnh');
    setLoading(true);
    setMessage(null);
    try {
      // If backend expects multipart/form-data, we should send FormData
      // But many student implementations accept base64 via JSON at /upload-avatar
  const res = await api.post('/auth/upload-avatar', { avatar: preview });
      setMessage(res.data?.message || 'Upload thành công');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '20px auto' }}>
      <h3>Upload Avatar</h3>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
      {preview && <img src={preview} alt="preview" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} />}
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>{loading ? 'Đang...' : 'Upload'}</button>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
};

export default UploadAvatar;
