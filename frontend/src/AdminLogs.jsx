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

export default function AdminLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

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
        res = await api.get(`/activity/search?${params.toString()}`);
      } else if (isToday) {
        const params = new URLSearchParams();
        if (action) params.set('action', action);
        if (userId) params.set('userId', userId.trim());
        params.set('limit', String(limit));
        res = await api.get(`/activity/recent?${params.toString()}`);
      } else {
        const params = new URLSearchParams();
        if (action) params.set('action', action);
        if (userId) params.set('userId', userId.trim());
        params.set('limit', String(limit));
        res = await api.get(`/activity/date/${encodeURIComponent(date)}?${params.toString()}`);
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

  return (
    <div className="card" style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Admin Activity Logs</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', alignItems: 'end' }}>
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
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label" htmlFor="search">Search</label>
          <input id="search" placeholder="Search in logs (JSON match)" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="limit">Limit</label>
          <input id="limit" type="number" min={10} max={200} step={10} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </div>
        <div>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load logs'}</button>
        </div>
      </form>

      {error && (
        <div className="alert" style={{ marginTop: 12, color: '#b00020' }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Time</th>
              <th style={{ textAlign: 'left' }}>User</th>
              <th style={{ textAlign: 'left' }}>Action</th>
              <th style={{ textAlign: 'left' }}>Status</th>
              <th style={{ textAlign: 'left' }}>IP</th>
              <th style={{ textAlign: 'left' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>No logs</td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.timestamp)}</td>
                <td>
                  {r.userId || 'anonymous'}
                </td>
                <td>{r.action}</td>
                <td>{r.details?.success === false ? 'failed' : (r.status || (r.statusCode && r.statusCode >= 400 ? 'failed' : 'success'))}</td>
                <td>{r.ip || r.ipAddress || '-'}</td>
                <td>
                  <pre style={{ margin: 0, maxWidth: 480, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(r.details || {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        Tip: Để demo Rate Limit, thử login sai quá 5 lần trong 1 phút sẽ bị 429. Sau đó reload Logs để thấy actions failed_login / BRUTE_FORCE.
      </div>
    </div>
  );
}
