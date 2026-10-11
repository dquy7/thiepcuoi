import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ImagePlus, Send, X, Check } from 'lucide-react';
import { backend, bucket, ensureGuest, friendlyError, MAX_PHOTOS, MAX_PHOTO_BYTES, photoUrl } from './backend.js';

export function GuestPage({ title, subtitle, onBack, children }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <section className="guest-page">
    <button className="guest-back" onClick={onBack}><ArrowLeft size={18} />Quay lại thiệp</button>
    <header className="guest-page-heading"><span className="eyebrow">NGÀY CHUNG ĐÔI</span><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{subtitle}</p></header>
    {children}
  </section>;
}
function ConnectionNotice() { return !backend && <p className="notice" role="status">Lời chúc và xác nhận online sẽ sớm mở. Bạn vui lòng quay lại sau nhé.</p>; }

export function WishesPage({ weddingId, onBack }) {
  const [wishes, setWishes] = useState([]);
  const [files, setFiles] = useState([]);
  const filesRef = useRef([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!backend);
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const feed = useRef(null);
  const load = useCallback(async () => {
    if (!backend) return;
    setLoading(true);
    const { data, error } = await backend.from('wishes').select('id,name,message,photos,created_at').eq('wedding_id', weddingId).order('created_at', { ascending: false }).order('id').limit(limit + 1);
    if (error) setLoadError('Chưa tải được lời chúc. Bấm thử lại để kết nối.');
    else { setWishes(data.slice(0, limit)); setHasMore(data.length > limit); setLoadError(''); }
    setLoading(false);
  }, [weddingId, limit]);
  useEffect(() => {
    load();
    if (!backend) return;
    const channel = backend.channel(`wishes-${weddingId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `wedding_id=eq.${weddingId}` }, load).subscribe();
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    // Khôi phục dữ liệu nếu mất kết nối Realtime hoặc khách quay lại tab.
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { backend.removeChannel(channel); window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [load, weddingId]);
  useEffect(() => () => filesRef.current.forEach(item => URL.revokeObjectURL(item.preview)), []);
  function updateFiles(next) { filesRef.current = next; setFiles(next); }
  function chooseFiles(event) {
    const incoming = [...event.target.files]; event.target.value = '';
    if (files.length + incoming.length > MAX_PHOTOS) { setStatus(`Bạn chọn tối đa ${MAX_PHOTOS} ảnh nhé.`); return; }
    if (incoming.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_PHOTO_BYTES)) {
      setStatus('Chọn ảnh JPG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB.'); return;
    }
    updateFiles([...files, ...incoming.map(file => ({ file, preview: URL.createObjectURL(file), id: crypto.randomUUID() }))]); setStatus('');
  }
  function removePhoto(id) {
    const item = files.find(item => item.id === id); URL.revokeObjectURL(item.preview);
    updateFiles(files.filter(item => item.id !== id));
  }
  async function submit(event) {
    event.preventDefault(); if (busy || !backend) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get('name')).trim(); const message = String(fields.get('message')).trim();
    if (!name || !message) { setStatus('Bạn điền tên và lời chúc nhé.'); return; }
    setBusy(true); setStatus(''); const uploaded = [];
    try {
      const user = await ensureGuest();
      for (const item of files) {
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[item.file.type];
        const path = `${user.id}/${weddingId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await backend.storage.from(bucket).upload(path, item.file, { contentType: item.file.type, upsert: false });
        if (error) throw error; uploaded.push(path);
      }
      const { error } = await backend.rpc('send_wish', { p_wedding_id: weddingId, p_name: name, p_message: message, p_photos: uploaded });
      if (error) throw error;
      files.forEach(item => URL.revokeObjectURL(item.preview)); updateFiles([]); form.reset();
      setStatus('Lời chúc đã gửi đến cô dâu chú rể và hiện trên bảng lời chúc chung. Cảm ơn bạn!');
      await load(); feed.current?.scrollTo({ left: 0, behavior: 'smooth' });
    } catch (error) {
      if (uploaded.length) await backend.storage.from(bucket).remove(uploaded);
      setStatus(friendlyError(error));
    } finally { setBusy(false); }
  }
  return <GuestPage title="Lời chúc yêu thương" subtitle="Gửi một lời chúc, lưu một khoảnh khắc — cùng chúng mình giữ lại niềm vui ngày cưới." onBack={onBack}>
    <ConnectionNotice />
    <form className="form guest-form" onSubmit={submit}><fieldset disabled={busy}>
      <label>Họ và tên<input name="name" autoComplete="name" maxLength={80} required placeholder="Tên của bạn" /></label>
      <label>Lời chúc<textarea name="message" rows={3} maxLength={1000} required placeholder="Chúc hai bạn trăm năm hạnh phúc…" /></label>
      <label className="photo-upload"><ImagePlus size={22} /><span>Thêm ảnh kỷ niệm <small>Không bắt buộc · tối đa 6 ảnh · 5 MB/ảnh</small></span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseFiles} aria-label="Chọn ảnh đính kèm lời chúc" /></label>
      {files.length > 0 && <div className="photo-previews">{files.map(item => <div key={item.id}><img src={item.preview} alt={`Ảnh đã chọn: ${item.file.name}`} /><button type="button" onClick={() => removePhoto(item.id)} aria-label={`Bỏ ảnh ${item.file.name}`}><X size={16} /></button></div>)}</div>}
      <p className="guest-form-note">Tên, lời chúc và ảnh bạn gửi sẽ được mọi người cùng xem.</p>
      <button className="primary-button" disabled={!backend || busy}><Send size={18} />{busy ? 'Đang gửi…' : 'Gửi lời chúc'}</button>
    </fieldset></form>
    {status && <p className="notice" role="status">{status}</p>}
    <div className="wish-feed-heading"><div><h2>Những lời thương mến</h2><p>Vuốt ngang để đọc lời chúc và xem ảnh của mọi người.</p></div><div className="wish-feed-arrows"><button aria-label="Lời chúc trước" onClick={() => feed.current?.scrollBy({ left: -340, behavior: 'smooth' })}><ChevronLeft /></button><button aria-label="Lời chúc tiếp theo" onClick={() => feed.current?.scrollBy({ left: 340, behavior: 'smooth' })}><ChevronRight /></button></div></div>
    {loadError && <p className="notice" role="alert">{loadError} <button onClick={load}>Thử lại</button></p>}
    {loading && <p className="muted" role="status">Đang tải lời chúc…</p>}
    {!loading && !loadError && wishes.length === 0 && <div className="wish-empty"><Heart size={28} /><p>Những lời chúc đầu tiên đang chờ bạn viết nên.</p></div>}
    <div className="wish-feed" ref={feed} tabIndex={0} aria-label="Lời chúc chung">{wishes.map(wish => <article className="wish-card" key={wish.id}>
      <div className="wish-author"><span className="wish-avatar">{wish.name.slice(0, 1).toLocaleUpperCase('vi')}</span><div><h3>{wish.name}</h3><time dateTime={wish.created_at}>{new Date(wish.created_at).toLocaleDateString('vi-VN')}</time></div><Heart size={19} /></div>
      <p className="wish-message">{wish.message}</p>
      {wish.photos.length > 0 && <div className={`wish-photos ${wish.photos.length === 1 ? 'single' : ''}`}>{wish.photos.map((path, index) => <a key={path} href={photoUrl(path)} target="_blank" rel="noreferrer" aria-label={`Xem ảnh ${index + 1} của ${wish.name}`}><img src={photoUrl(path)} alt={`Ảnh kỷ niệm ${index + 1} do ${wish.name} gửi`} loading="lazy" /></a>)}</div>}
      <span className="wish-card-footer">Gửi yêu thương đến ngày chung đôi ♡</span>
    </article>)}</div>
    {hasMore && <button className="guest-back" onClick={() => setLimit(limit + 20)} disabled={loading}>Xem thêm lời chúc</button>}
  </GuestPage>;
}

export function RsvpPage({ weddingId, events, onBack }) {
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState(''); const [attendance, setAttendance] = useState('yes');
  async function submit(event) {
    event.preventDefault(); if (!backend || busy) return;
    const form = event.currentTarget; const fields = new FormData(form);
    const name = String(fields.get('name')).trim();
    const selected = fields.getAll('events');
    if (!name || (attendance === 'yes' && !selected.length)) { setStatus('Bạn điền tên và chọn ít nhất một buổi tham dự nhé.'); return; }
    setBusy(true); setStatus('');
    try {
      await ensureGuest();
      const { error } = await backend.rpc('send_rsvp', { p_wedding_id: weddingId, p_name: name, p_attendance: attendance === 'yes', p_guests: attendance === 'yes' ? Number(fields.get('guests')) : 0, p_events: attendance === 'yes' ? selected : [] });
      if (error) throw error;
      setStatus('Đã gửi xác nhận đến cô dâu chú rể. Bạn có thể gửi lại để cập nhật lựa chọn trên thiết bị này.');
    } catch (error) { setStatus(friendlyError(error)); } finally { setBusy(false); }
  }
  return <GuestPage title="Hẹn gặp bạn ngày chung đôi" subtitle="Cho chúng mình biết bạn có thể đến để chuẩn bị đón tiếp thật chu đáo nhé." onBack={onBack}>
    <ConnectionNotice /><form className="form guest-form" onSubmit={submit}><fieldset disabled={busy}>
      <label>Họ và tên<input name="name" autoComplete="name" maxLength={80} required placeholder="Tên của bạn" /></label>
      <label>Bạn sẽ tham dự chứ?<select name="attendance" value={attendance} onChange={event => setAttendance(event.target.value)}><option value="yes">Mình sẽ đến chung vui</option><option value="no">Tiếc quá, mình không thể đến</option></select></label>
      {attendance === 'yes' && <><div className="rsvp-events"><p>Bạn tham dự buổi nào?</p>{events.map(event => <label key={event.id}><input type="checkbox" name="events" value={event.id} /><span><strong>{event.title}</strong><small>{event.time} {event.date}</small></span></label>)}</div><label>Số người tham dự (bao gồm bạn)<input name="guests" type="number" min={1} max={20} defaultValue={1} required /></label></>}
      <p className="guest-form-note">Thông tin xác nhận chỉ cô dâu chú rể xem được.</p>
      <button className="primary-button" disabled={!backend || busy}><Check size={18} />{busy ? 'Đang gửi…' : 'Gửi xác nhận'}</button>
    </fieldset></form>{status && <p className="notice" role="status">{status}</p>}
  </GuestPage>;
}
