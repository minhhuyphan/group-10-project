import React, { useEffect, useMemo, useState } from 'react';
import api from './api';

const ACTION_OPTIONS = [
  'login',
  'failed_login',
  'account_locked',
  'logout',
  'signup',
  'forgot_password',
  'reset_password',
  'update_profile',
  'upload_avatar',
  'refresh_token',
  'admin_action',
  'other',
];

const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (_) {
    return iso;
  }
};

const formatRelative = (iso) => {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return `${s}s trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const days = Math.floor(h / 24);
    return `${days} ngày trước`;
  } catch (_) {
    return '';
  }
};

export default function AdminLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);
  const [expanded, setExpanded] = useState({});

  const isToday = useMemo(() => {
    return date === new Date().toISOString().slice(0, 10);
  }, [date]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (search.trim()) {
        const params = new URLSearchParams();
        params.set('date', date);
        params.set('search', search.trim());
        if (action) params.set('action', action);
        if (userId) params.set('userId', userId.trim());
        params.set('limit', String(limit));
  res = await api.get(`/api/activity/search?${params.toString()}`);
      } else if (isToday) {
        const params = new URLSearchParams();
        if (action) params.set('action', action);
        if (userId) params.set('userId', userId.trim());
        params.set('limit', String(limit));
  res = await api.get(`/api/activity/recent?${params.toString()}`);
      } else {
        const params = new URLSearchParams();
        if (action) params.set('action', action);
        if (userId) params.set('userId', userId.trim());
        params.set('limit', String(limit));
  res = await api.get(`/api/activity/date/${encodeURIComponent(date)}?${params.toString()}`);
      }

      const data = res?.data?.data?.activities || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to load logs';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setAction('');
    setUserId('');
    setSearch('');
    setLimit(50);
  };

  const toggleRow = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="card" style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      <div className="logs-header">
        <div>
          <h2 style={{ margin: 0 }}>Admin Activity Logs</h2>
          <p className="muted" style={{ margin: '6px 0 0 0' }}>Giám sát hoạt động người dùng và demo rate limiting</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Hôm nay</button>
          <button type="button" className="btn refresh-btn" onClick={fetchLogs} disabled={loading}>{loading ? 'Đang tải…' : 'Refresh'}</button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="logs-filters">
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="action">Action</label>
          <select id="action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="userId">User ID</label>
          <input id="userId" placeholder="User ObjectId" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div className="logs-search">
          <label className="label" htmlFor="search">Search</label>
          <input id="search" placeholder="Search in logs (JSON match)" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="limit">Limit</label>
          <input id="limit" type="number" min={10} max={200} step={10} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </div>
        <div className="logs-buttons">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load logs'}</button>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {error && (
        <div className="alert" style={{ marginTop: 12, color: '#b00020' }}>
          {error}
        </div>
      )}

      <div className="logs-table-wrap">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Status</th>
              <th>IP</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="muted">Đang tải dữ liệu…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>No logs</td>
              </tr>
            )}
            {rows.map((r, idx) => {
              const status = r.details?.success === false ? 'failed' : (r.status || (r.statusCode && r.statusCode >= 400 ? 'failed' : 'success'));
              const isOpen = !!expanded[idx];
              return (
                <tr key={idx} className={isOpen ? 'expanded' : ''}>
                  <td>
                    <div className="time-col">
                      <div>{formatDateTime(r.timestamp)}</div>
                      <small className="muted">{formatRelative(r.timestamp)}</small>
                    </div>
                  </td>
                  <td className="code mono">{r.userId || 'anonymous'}</td>
                  <td><span className="badge badge-action">{r.action}</span></td>
                  <td>
                    <span className={`badge ${status === 'failed' ? 'badge-failed' : 'badge-success'}`}>{status}</span>
                  </td>
                  <td className="code mono">{r.ip || r.ipAddress || '-'}</td>
                  <td>
                    <div className="details-col">
                      {!isOpen && (
                        <pre className="details-preview">{JSON.stringify(r.details || {}, null, 2).slice(0, 160)}{JSON.stringify(r.details || {}, null, 2).length > 160 ? '…' : ''}</pre>
                      )}
                      {isOpen && (
                        <pre className="details-full">{JSON.stringify(r.details || {}, null, 2)}</pre>
                      )}
                      <div className="row-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => toggleRow(idx)}>{isOpen ? 'Thu gọn' : 'Xem chi tiết'}</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        Tip: Để demo Rate Limit, thử login sai quá 5 lần trong 1 phút sẽ bị 429. Sau đó reload Logs để thấy actions failed_login / BRUTE_FORCE.
      </div>
    </div>
  );
}
