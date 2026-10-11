import React, { useEffect, useState } from 'react';
import { backend, bucket } from './backend.js';
import { GuestPage } from './GuestPages.jsx';

export default function AdminPage({ weddingId, events, onBack }) {
  const [allowed, setAllowed] = useState(false); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(''); const [rsvps, setRsvps] = useState([]); const [wishes, setWishes] = useState([]);
  const [editingRsvp, setEditingRsvp] = useState(null);
  const [editingWish, setEditingWish] = useState(null);
  function editError() { return 'Chưa lưu được. Nếu chưa bật quyền sửa/xóa, hãy chạy supabase/admin-edit.sql trong SQL Editor rồi thử lại.'; }
  async function saveRsvp(event) {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget);
    const attendance = fields.get('attendance') === 'yes';
    const name = String(fields.get('name')).trim();
    const selected = attendance ? fields.getAll('events') : [];
    if (!name || (attendance && !selected.length)) { setStatus('Điền tên và chọn ít nhất một buổi tham dự.'); return; }
    setBusy(true); setStatus('');
    const result = await backend.from('rsvps').update({ name, attendance, guests: attendance ? Number(fields.get('guests')) : 0, events: selected }).eq('id', editingRsvp.id).eq('wedding_id', weddingId).select('id').single();
    if (result.error) { setStatus(editError()); setBusy(false); return; }
    setEditingRsvp(null); setStatus('Đã cập nhật xác nhận tham dự.'); await load();
  }
  async function removeRsvp(row) {
    if (busy || !window.confirm(`Xóa xác nhận của ${row.name}?`)) return;
    setBusy(true); setStatus('');
    const result = await backend.from('rsvps').delete().eq('id', row.id).eq('wedding_id', weddingId).select('id').single();
    if (result.error) { setStatus(editError()); setBusy(false); return; }
    if (editingRsvp?.id === row.id) setEditingRsvp(null);
    setStatus('Đã xóa xác nhận tham dự.'); await load();
  }
  async function saveWish(event) {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name')).trim(); const message = String(fields.get('message')).trim();
    if (!name || !message) { setStatus('Điền tên và nội dung lời chúc.'); return; }
    setBusy(true); setStatus('');
    const result = await backend.from('wishes').update({ name, message }).eq('id', editingWish.id).eq('wedding_id', weddingId).select('id').single();
    if (result.error) { setStatus(editError()); setBusy(false); return; }
    setEditingWish(null); setStatus('Đã cập nhật lời chúc.'); await load();
  }
  async function load() {
    if (!backend) return;
    setBusy(true);
    try {
      const session = await backend.auth.getSession(); if (session.error) throw session.error;
      const user = session.data.session?.user;
      if (!user || user.is_anonymous) { setAllowed(false); return; }
      const permission = await backend.from('wedding_admins').select('wedding_id').eq('wedding_id', weddingId).eq('user_id', user.id).maybeSingle();
      if (permission.error) throw permission.error;
      if (!permission.data) { setAllowed(false); setStatus('Tài khoản này chưa được cấp quyền quản lý thiệp.'); return; }
      setAllowed(true);
      // Phân trang để không mất xác nhận khi vượt giới hạn 1000 bản ghi của API.
      const rows = []; let offset = 0;
      while (true) {
        const result = await backend.from('rsvps').select('*').eq('wedding_id', weddingId).order('updated_at', { ascending: false }).order('id').range(offset, offset + 499);
        if (result.error) throw result.error; rows.push(...result.data);
        if (result.data.length < 500) break; offset += 500;
      }
      setRsvps(rows);
      const result = await backend.from('wishes').select('id,name,message,photos,created_at').eq('wedding_id', weddingId).order('created_at', { ascending: false }).limit(100);
      if (result.error) throw result.error; setWishes(result.data);
    } catch { setStatus('Chưa tải được dữ liệu quản lý. Bạn thử lại nhé.'); } finally { setBusy(false); }
  }
  useEffect(() => { load(); }, [weddingId]);
  async function login(event) {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); setStatus('');
    const { error } = await backend.auth.signInWithPassword({ email: String(fields.get('email')).trim(), password: String(fields.get('password')) });
    setBusy(false); if (error) setStatus('Đăng nhập không thành công. Kiểm tra email và mật khẩu.'); else await load();
  }
  async function removeWish(wish) {
    if (!window.confirm(`Xóa lời chúc của ${wish.name}?`)) return;
    setBusy(true); setStatus('');
    const result = await backend.from('wishes').delete().eq('id', wish.id).eq('wedding_id', weddingId).select('id').single();
    if (result.error) { setStatus('Không xóa được lời chúc.'); setBusy(false); return; }
    if (editingWish?.id === wish.id) setEditingWish(null);
    if (wish.photos.length) {
      const cleanup = await backend.storage.from(bucket).remove(wish.photos);
      if (cleanup.error) setStatus('Đã xóa lời chúc; một số ảnh cần xóa thêm trong Storage.');
    }
    await load();
  }
  function exportCsv() {
    const cell = value => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [['Họ tên','Tham dự','Số người','Buổi tham dự','Cập nhật'], ...rsvps.map(row => [row.name,row.attendance ? 'Có' : 'Không',row.guests,row.events.map(id => events.find(event => event.id === id)?.title || id).join('; '),row.updated_at])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `xac-nhan-${weddingId}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  return <GuestPage title="Quản lý thiệp cưới" subtitle="Danh sách xác nhận riêng và những lời chúc dành cho hai bạn." onBack={onBack}>
    {!backend && <p className="notice">Chưa kết nối Supabase. Làm theo hướng dẫn trong supabase/README.md để bật chức năng online.</p>}
    {backend && !allowed && <form className="form guest-form" onSubmit={login}><label>Email quản lý<input name="email" type="email" autoComplete="username" required /></label><label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary-button" disabled={busy}>Đăng nhập quản lý</button></form>}
    {status && <p className="notice" role="status">{status}</p>}
    {allowed && <><div className="admin-actions"><button className="primary-button" onClick={load} disabled={busy}>Làm mới</button><button className="primary-button" onClick={exportCsv}>Xuất CSV</button><button className="guest-back" onClick={async () => { await backend.auth.signOut(); setAllowed(false); setRsvps([]); setWishes([]); }}>Đăng xuất</button></div>
      <div className="admin-stats">{events.map(event => <article key={event.id}><strong>{rsvps.filter(row => row.attendance && row.events.includes(event.id)).reduce((sum,row) => sum + row.guests,0)}</strong><span>{event.title}</span></article>)}<article><strong>{rsvps.filter(row=>!row.attendance).length}</strong><span>Xác nhận không đến</span></article></div>
      <h2 className="admin-section-title">Xác nhận tham dự · {rsvps.length}</h2><div className="admin-table-wrap"><table><thead><tr><th>Họ tên</th><th>Tham dự</th><th>Số người</th><th>Buổi</th><th>Thao tác</th></tr></thead><tbody>{rsvps.map(row => <React.Fragment key={row.id}><tr><td>{row.name}</td><td>{row.attendance ? 'Có' : 'Không'}</td><td>{row.guests}</td><td>{row.events.map(id => events.find(event=>event.id===id)?.title || id).join(', ')}</td><td><div className="admin-row-actions"><button disabled={busy} onClick={() => { setEditingRsvp({ ...row }); setStatus(''); }}>Sửa</button><button className="delete" disabled={busy} onClick={() => removeRsvp(row)}>Xóa</button></div></td></tr>
        {editingRsvp?.id === row.id && <tr><td colSpan={5}><form className="form admin-editor" onSubmit={saveRsvp}><fieldset disabled={busy}>
          <label>Họ tên<input name="name" maxLength={80} required defaultValue={row.name} /></label>
          <label>Tham dự<select name="attendance" value={editingRsvp.attendance ? 'yes' : 'no'} onChange={event => setEditingRsvp({ ...editingRsvp, attendance: event.target.value === 'yes' })}><option value="yes">Có</option><option value="no">Không</option></select></label>
          {editingRsvp.attendance && <><label>Số người<input name="guests" type="number" min={1} max={20} required defaultValue={row.guests || 1} /></label><div className="rsvp-events">{events.map(event => <label key={event.id}><input name="events" value={event.id} type="checkbox" defaultChecked={row.events.includes(event.id)} /><span>{event.title}</span></label>)}</div></>}
          <div className="admin-actions"><button className="primary-button">Lưu thay đổi</button><button type="button" className="guest-back" onClick={() => setEditingRsvp(null)}>Hủy</button></div>
        </fieldset></form></td></tr>}
      </React.Fragment>)}</tbody></table></div>
      <h2 className="admin-section-title">100 lời chúc gần nhất</h2><div className="admin-wishes">{wishes.map(wish=><article key={wish.id}>
        {editingWish?.id === wish.id ? <form className="form admin-editor" onSubmit={saveWish}><fieldset disabled={busy}><label>Tên người gửi<input name="name" required maxLength={80} defaultValue={wish.name} /></label><label>Lời chúc<textarea name="message" required maxLength={1000} rows={3} defaultValue={wish.message} /></label><small>Ảnh đính kèm được giữ nguyên.</small><div className="admin-actions"><button className="primary-button">Lưu thay đổi</button><button type="button" className="guest-back" onClick={() => setEditingWish(null)}>Hủy</button></div></fieldset></form> : <><strong>{wish.name}</strong><p>{wish.message}</p><div className="admin-row-actions"><button disabled={busy} onClick={() => { setEditingWish(wish); setStatus(''); }}>Sửa lời chúc</button><button className="delete" disabled={busy} onClick={()=>removeWish(wish)}>Xóa lời chúc</button></div></>}
      </article>)}</div>
    </>}
  </GuestPage>;
}
