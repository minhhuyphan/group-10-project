import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = ({ to }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    try {
      // Try to go back in history first
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback: go to provided `to` or home
    if (to) navigate(to);
    else navigate('/');
  };

  // Don't render on root path (optional) - but still render per request
  return (
    <button
      type="button"
      className="back-btn"
      onClick={handleBack}
      title="Quay lại"
    >
      ← Quay lại
    </button>
  );
};

export default BackButton;
