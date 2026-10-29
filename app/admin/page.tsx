'use client';

import { useState } from 'react';

type AdminBooking = { id: string; customerName: string; phone: string; email: string; gameType: string; date: string; startHour: number; duration: number; total: number; status: 'pending' | 'confirmed' | 'cancelled'; createdAt: string };
function hourLabel(hour: number) { const suffix = hour >= 12 ? 'PM' : 'AM'; return `${hour % 12 || 12}:00 ${suffix}`; }
function prettyDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  async function loadBookings(event?: React.FormEvent) {
    event?.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load bookings.');
      setBookings(data.bookings); setLoaded(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load bookings.'); setLoaded(false); }
    finally { setLoading(false); }
  }
  async function updateStatus(id: string, status: AdminBooking['status']) {
    setError('');
    try {
      const response = await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update status.');
      setBookings(current => current.map(b => b.id === id ? { ...b, status } : b));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update booking.'); }
  }
  return <><header className="wrap nav"><a className="brand" href="/"><span className="mark">HRC</span><span>HRC SPORTS<small>ADMIN DASHBOARD</small></span></a><a href="/" className="outline" style={{ color: '#17221c', borderColor: '#dce2d9' }}>← Public website</a></header><main className="wrap admin-wrap"><div className="admin-top"><div><div className="kicker">Reservations</div><h1 style={{ fontSize: 'clamp(32px,4vw,46px)', letterSpacing: '-1.8px', margin: '9px 0' }}>Booking dashboard</h1><p style={{ color: '#68756c', fontSize: 13 }}>View reservations and update their status.</p></div><div><span className="step">{bookings.length} BOOKINGS LOADED</span></div></div><form className="panel" onSubmit={loadBookings} style={{ marginTop: 20 }}><div className="fields" style={{ marginBottom: 0 }}><div className="field-wrap"><label htmlFor="token">Admin token</label><input className="field" id="token" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Enter ADMIN_TOKEN from .env.local" required autoComplete="current-password"/></div><div className="field-wrap" style={{ alignSelf: 'end' }}><button className="btn" type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load bookings'}</button></div></div><p className="hint" style={{ textAlign: 'left' }}>The token is sent only to your own API endpoint. Do not share it or commit it to source control.</p>{error && <div className="notice error" role="alert">{error}</div>}</form>
    {loaded && <div className="table-wrap"><table className="table"><thead><tr><th>Customer</th><th>Date &amp; time</th><th>Duration</th><th>Phone</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>{bookings.map(b => <tr key={b.id}><td><strong>{b.customerName}</strong><br/><span style={{ color: '#68756c' }}>{b.gameType}</span></td><td>{prettyDate(b.date)}<br/>{hourLabel(b.startHour)} – {hourLabel(b.startHour + b.duration)}</td><td>{b.duration} hour(s)</td><td>{b.phone}{b.email && <><br/>{b.email}</>}</td><td>₹{b.total.toLocaleString('en-IN')}</td><td><span className={`badge ${b.status}`}>{b.status}</span></td><td>{b.status !== 'confirmed' && b.status !== 'cancelled' && <button className="small-btn" onClick={() => void updateStatus(b.id, 'confirmed')}>Confirm</button>}{b.status !== 'cancelled' && <button className="small-btn" onClick={() => void updateStatus(b.id, 'cancelled')}>Cancel</button>}{b.status === 'cancelled' && <button className="small-btn" onClick={() => void updateStatus(b.id, 'pending')}>Reopen</button>}</td></tr>)}</tbody></table>{bookings.length === 0 && <div className="empty">No bookings yet.</div>}</div>}
    {!loaded && <div className="panel" style={{ marginTop: 20 }}><p style={{ color: '#68756c', fontSize: 13, margin: 0 }}>Enter your admin token and load bookings to see reservations here.</p></div>}
  </main></>;
}
