import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutThunk, setUser } from "./store/authSlice";
import api from "./api";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [localAge, setLocalAge] = useState(user?.age || "");
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar || "/logo192.png"
  );
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);

  const handleAvatarClick = () => fileRef.current && fileRef.current.click();
  const handleAvatarFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Compress large images client-side to reduce payload size
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1000; // max width in px
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Export as JPEG with quality to reduce size
        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        setAvatarPreview(compressed);
      };
      img.onerror = () => {
        // fallback to raw data URL if image can't be processed
        setAvatarPreview(reader.result);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {};
      if (localAge !== "" && localAge !== null) payload.age = localAge;
      if (avatarPreview) payload.avatar = avatarPreview;
      const res = await api.put("/profile", payload);
      if (res.data && res.data.user) {
        setUser && setUser(res.data.user);
        setMessage("Lưu thành công");
      } else setMessage("Đã lưu");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Lỗi");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2500);
    }
  };

  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setMessage("");
    try {
      const res = await api.put("/profile", { avatar: avatarPreview });
      if (res.data && res.data.user) {
        dispatch(setUser(res.data.user));
        setMessage("Ảnh đã được lưu");
      } else setMessage("Đã lưu ảnh");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Lỗi");
    } finally {
      setSavingAvatar(false);
      setTimeout(() => setMessage(""), 2500);
    }
  };

  return (
    <>
      <div className="split-profile">
        <div className="split-left card">
          <h1 className="profile-name">{user?.name || "Người dùng"}</h1>
          <p className="profile-role muted">Người viết nội dung</p>

          <div className="contact-list">
            <p>
              <strong>Phone:</strong> 024 3456 7890
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Tuổi:</strong>
              <input
                type="number"
                min="1"
                max="150"
                value={localAge}
                onChange={(e) => setLocalAge(e.target.value)}
                style={{
                  width: 80,
                  marginLeft: 8,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #e6e9ef",
                }}
              />
            </p>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thông tin"}
            </button>
            <button
              onClick={() => {
                dispatch(logoutThunk());
                navigate("/");
              }}
              className="btn btn-ghost"
            >
              Thoát
            </button>
          </div>
          {message && (
            <div style={{ marginTop: 10, color: "#2563eb" }}>{message}</div>
          )}
        </div>

        <div className="split-right">
          <div className="avatar-panel">
            <img
              className="avatar-hero"
              src={avatarPreview || user?.avatar || "/logo192.png"}
              alt="avatar"
            />
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleAvatarClick} className="btn btn-ghost">
                  Đổi ảnh
                </button>
                <button
                  onClick={handleSaveAvatar}
                  className="btn btn-primary"
                  disabled={savingAvatar}
                >
                  {savingAvatar ? "Đang lưu..." : "Lưu ảnh"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile editor removed — page shows only the top profile hero */}
    </>
  );
}
