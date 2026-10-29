'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Availability = { unavailableHours: number[]; ratePerHour: number; openingHour: number; closingHour: number };
type BookingResult = { message?: string; error?: string; booking?: { id: string; status: string; total: number } };
const GAME_TYPES = ['Friendly match', 'Practice session', 'Corporate game', 'Tournament / league'];
const DEFAULT_RATE = Math.max(0, Number(process.env.NEXT_PUBLIC_HOURLY_RATE ?? 800) || 0);
function localDate(date = new Date()) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); }
function hourLabel(hour: number) { const suffix = hour >= 12 ? 'PM' : 'AM'; const h = hour % 12 || 12; return `${String(h).padStart(2, '0')}:00 ${suffix}`; }
function prettyDate(date: string) { return date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Choose a date'; }

export default function HomePage() {
  const [date, setDate] = useState(localDate());
  const [duration, setDuration] = useState(1);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Availability>({ unavailableHours: [], ratePerHour: DEFAULT_RATE, openingHour: 6, closingHour: 22 });
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gameType, setGameType] = useState(GAME_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const hours = useMemo(() => Array.from({ length: availability.closingHour - availability.openingHour }, (_, i) => i + availability.openingHour), [availability]);
  const total = availability.ratePerHour * duration;

  const loadAvailability = useCallback(async (selectedDate: string) => {
    setLoadingSlots(true); setStartHour(null); setNotice(null);
    try {
      const response = await fetch(`/api/bookings?date=${encodeURIComponent(selectedDate)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load slots.');
      setAvailability(data);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load availability.' });
    } finally { setLoadingSlots(false); }
  }, []);
  useEffect(() => { void loadAvailability(date); }, [date, loadAvailability]);
  const isUnavailable = (hour: number) => {
    for (let h = hour; h < hour + duration; h++) if (h >= availability.closingHour || availability.unavailableHours.includes(h)) return true;
    // For today, do not offer a start time in the past (uses the visitor's local clock).
    if (date === localDate() && hour <= new Date().getHours()) return true;
    return false;
  };

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(null);
    if (startHour === null) { setNotice({ kind: 'error', text: 'Choose an available time slot first.' }); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName, phone, email, gameType, date, startHour, duration }) });
      const result: BookingResult = await response.json();
      if (!response.ok) throw new Error(result.error || 'Booking request failed.');
      setNotice({ kind: 'success', text: `Request received! Reference: ${result.booking?.id}. Your booking is pending confirmation. Total: ₹${(result.booking?.total ?? total).toLocaleString('en-IN')}.` });
      setCustomerName(''); setPhone(''); setEmail(''); setStartHour(null); await loadAvailability(date);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Something went wrong.' });
      await loadAvailability(date);
    } finally { setBusy(false); }
  }

  return <>
    <header className="wrap nav"><a className="brand" href="#home"><span className="mark">HRC</span><span>HRC SPORTS<small>PLAY YOUR GAME</small></span></a><nav className="links"><a href="#experience">The experience</a><a href="#booking">Book a slot</a><a href="#contact">Contact</a></nav><a className="btn" href="#booking">BOOK A TURF ↗</a></header>
    <main>
      <section className="hero" id="home"><div className="wrap hero-grid"><div><div className="eyebrow">Your next match starts here</div><h1>Bring your game.<br/><span>Own the pitch.</span></h1><p className="hero-copy">Good games start with great grounds. Grab your crew, pick your time, and make every over count at HRC Sports.</p><div className="actions"><a className="btn" href="#booking">Find your time slot ↗</a><a className="outline" href="#experience">Explore the turf ↓</a></div><p className="hero-note">● &nbsp; <strong>Made for match days</strong> · Friends, teams &amp; weekend leagues</p></div><div className="pitch" aria-label="Stylized cricket pitch illustration"><div className="pitch-lines"/><div className="pitch-strip"/><div className="stumps"/><div className="ball"/><div className="pitch-tag">Your turf. Your rules.</div></div></div></section>
      <div className="wrap stats"><div className="stat"><strong>60 min</strong><span>Flexible booking slots</span></div><div className="stat"><strong>Day + Night</strong><span>Choose your game time</span></div><div className="stat"><strong>All skill levels</strong><span>Bring your whole team</span></div></div>
      <section className="section" id="booking"><div className="wrap"><div className="section-head"><div><div className="kicker">Make it official</div><h2>Book your next innings.</h2></div><p className="desc">Choose a date, find a free slot, and send your booking request. Your request is saved to the HRC Sports booking database.</p></div>
        <div className="booking-grid"><form className="panel" onSubmit={submitBooking}><div className="panel-head"><h3>Choose your slot</h3><span className="step">STEP 01 / 02</span></div>
          <div className="fields"><div className="field-wrap"><label htmlFor="date">Match date</label><input className="field" id="date" type="date" min={localDate()} value={date} required onChange={e => setDate(e.target.value)}/></div><div className="field-wrap"><label htmlFor="duration">Duration</label><select className="field" id="duration" value={duration} onChange={e => { setDuration(Number(e.target.value)); setStartHour(null); }}><option value={1}>1 hour</option><option value={2}>2 hours</option><option value={3}>3 hours</option></select></div></div>
          <div className="slot-head"><span>Available time slots</span><span style={{ color: '#68756c', fontWeight: 500 }}>{loadingSlots ? 'Checking…' : 'Availability updates by date'}</span></div>
          <div className="slots" aria-label="Time slots">{hours.map(hour => { const unavailable = isUnavailable(hour); return <button key={hour} type="button" className={`slot ${startHour === hour ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`} disabled={loadingSlots || unavailable} aria-pressed={startHour === hour} onClick={() => setStartHour(hour)}><strong>{hourLabel(hour)}</strong><span>{unavailable ? 'Unavailable' : startHour === hour ? 'Selected' : `₹${availability.ratePerHour.toLocaleString('en-IN')} / hr`}</span></button>; })}</div>
          <div className="form-fields"><div className="field-wrap"><label htmlFor="name">Your name</label><input className="field" id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" autoComplete="name" minLength={2} maxLength={90} required/></div><div className="field-wrap"><label htmlFor="phone">Phone number</label><input className="field" id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" autoComplete="tel" type="tel" required/></div><div className="field-wrap full"><label htmlFor="email">Email (optional)</label><input className="field" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" type="email"/></div><div className="field-wrap full"><label htmlFor="game">What are you planning?</label><select className="field" id="game" value={gameType} onChange={e => setGameType(e.target.value)}>{GAME_TYPES.map(game => <option key={game}>{game}</option>)}</select></div></div>
          {notice && <div className={`notice ${notice.kind === 'error' ? 'error' : ''}`} role="status">{notice.text}</div>}
          <div style={{ marginTop: 18 }}><button className="btn" type="submit" disabled={busy || loadingSlots} style={{ width: '100%' }}>{busy ? 'Sending request…' : 'Request this booking ↗'}</button></div>
        </form>
        <aside className="panel summary"><div className="summary-top"><small>Your match, your moment</small><h3>Booking summary</h3><p>Review your details before sending a request to HRC Sports.</p></div><div className="line"><span>Date</span><strong>{prettyDate(date)}</strong></div><div className="line"><span>Time</span><strong>{startHour === null ? 'Select a slot' : `${hourLabel(startHour)} – ${hourLabel(startHour + duration)}`}</strong></div><div className="line"><span>Duration</span><strong>{duration} {duration === 1 ? 'hour' : 'hours'}</strong></div><div className="line"><span>Rate per hour</span><strong>₹{availability.ratePerHour.toLocaleString('en-IN')}</strong></div><div className="total"><span>Estimated total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><p className="hint">Reservations are created as pending until the turf confirms them. Prices and opening hours can be changed in the project configuration.</p></aside></div>
      </div></section>
      <section className="section feature-section" id="experience"><div className="wrap"><div className="section-head"><div><div className="kicker">The HRC experience</div><h2>More than just a pitch.</h2></div><p className="desc">A simple, smooth setup for your next game. Update these highlights to match your actual facilities.</p></div><div className="features"><article className="feature"><div className="feature-icon">🏏</div><h3>Made for cricket</h3><p>A dedicated place to practise, compete, and spend quality time with your team.</p></article><article className="feature"><div className="feature-icon">☀️</div><h3>Your time, your game</h3><p>Choose a slot that suits your squad, from a quick practice to a longer match session.</p></article><article className="feature"><div className="feature-icon">📱</div><h3>Easy booking</h3><p>Pick your preferred time and send a request without a long back-and-forth.</p></article></div></div></section>
      <section className="section" id="contact"><div className="wrap"><div className="cta"><div><div className="kicker" style={{ color: '#344a1c' }}>Get your team together</div><h2>Ready to make the next match count?</h2><p>Choose a date and request your HRC Sports slot today.</p></div><a className="btn dark-btn" href="#booking">Book your slot ↗</a></div></div></section>
    </main>
    <footer><div className="wrap footer-row"><a className="brand" href="#home"><span className="mark">HRC</span><span>HRC SPORTS<small>PLAY YOUR GAME</small></span></a><span>© {new Date().getFullYear()} HRC Sports · Built for the love of cricket.</span><a href="#booking">Book a slot ↑</a><a href="/admin">Admin</a></div></footer>
  </>;
}
