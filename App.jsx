import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Gift, Heart, House, Images, Leaf, MapPin, Menu, Music2, Pause, Play, UserRoundCheck, X } from 'lucide-react';

import { defaultWeddingId, weddings } from './weddings.js';
import WelcomeConfetti from './WelcomeConfetti.jsx';
const steps = [
  { id: 'home', icon: CalendarDays, title: 'Xem thông tin lễ cưới', text: 'Tìm hiểu thời gian, địa điểm, nhà trai, nhà gái và các thông tin quan trọng khác.' },
  { id: 'rsvp', icon: UserRoundCheck, title: 'Xác nhận tham dự', text: 'Nhấn vào nút “Xác nhận tham dự” để gửi thông tin của bạn cho Ban Tổ Chức.' },
  { id: 'map', icon: MapPin, title: 'Xem bản đồ', text: 'Nhấn vào biểu tượng bản đồ để xem đường đi và vị trí tổ chức lễ cưới.' },
  { id: 'album', icon: Images, title: 'Xem album ảnh', text: 'Cùng xem lại những khoảnh khắc đẹp trong hành trình yêu thương của chúng mình.' },
  { id: 'music', icon: Music2, title: 'Nghe nhạc cưới', text: 'Chọn bài hát yêu thích. Hết bài, nhạc tự chuyển sang một bài khác.' },
  { id: 'wishes', icon: Gift, title: 'Gửi lời chúc', text: 'Để lại lời chúc yêu thương cho cặp đôi trong ngày trọng đại.' },
];
const navigation = [
  { id: 'home', icon: House, label: 'Trang chủ' }, { id: 'rsvp', icon: CalendarDays, label: 'Xác nhận' },
  { id: 'map', icon: MapPin, label: 'Bản đồ' }, { id: 'album', icon: Images, label: 'Album' }, { id: 'wishes', icon: Heart, label: 'Lời chúc' },
];
function readSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function assetUrl(url) {
  return url?.startsWith('/') && !url.startsWith('//') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url;
}
function Divider() { return <div className="divider" aria-hidden="true"><span /><Heart size={16} fill="currentColor" /><span /></div>; }
function MapPreview({ href, venue }) {
  return <a className="map-preview" href={href} target="_blank" rel="noreferrer" aria-label={`Mở Google Maps chỉ đường đến ${venue}`}>
    <svg className="map-art" viewBox="0 0 700 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="700" height="220" fill="#edf0e6" />
      <path d="M0 25H160V90H0ZM210 0H320V65H210ZM540 120H700V220H540ZM30 155H180V220H30Z" fill="#dce5d3" />
      <path d="M520-20C410 60 590 100 475 245" stroke="#c7dfe0" strokeWidth="32" fill="none" />
      <path d="M-30 115L730 65M190-20L230 240M355-20L310 240M590-20L650 240M-20 195L740 145" stroke="#fffdf8" strokeWidth="16" fill="none" />
      <path d="M-30 115L730 65M190-20L230 240M355-20L310 240" stroke="#e4ddd0" strokeWidth="2" fill="none" />
      <path d="M230 220L217 99L350 91" stroke="#879e86" strokeWidth="5" strokeDasharray="8 7" strokeLinecap="round" fill="none" />
    </svg>
    <span className="map-preview-content"><span className="map-marker"><MapPin size={27} fill="currentColor" stroke="#fff" /></span><strong>{venue}</strong><span className="map-preview-action">Xem bản đồ & chỉ đường<ChevronRight size={17} /></span></span>
  </a>;
}
function Flower({ flip = false }) {
  return <svg className={`flower ${flip ? 'flip' : ''}`} viewBox="0 0 100 135" fill="none" aria-hidden="true">
    <path d="M48 130C43 99 22 83 28 32M49 130C57 99 81 80 73 29M42 108C25 108 14 98 10 86C24 88 36 93 42 108ZM53 109C75 107 87 97 90 88C77 89 63 95 53 109ZM33 83C16 79 12 65 15 55C30 65 33 72 33 83ZM62 78C79 74 87 62 87 50C74 54 66 65 62 78ZM73 49C59 38 60 26 67 15C75 26 79 35 73 49Z" stroke="#839782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 43C5 41 3 27 13 25C11 12 24 11 27 26C38 12 47 20 36 30C52 31 46 45 27 43ZM72 90C53 87 50 75 60 73C58 60 71 61 72 76C86 64 94 76 81 81C94 91 82 97 72 90Z" stroke="#dca5a5" strokeWidth="2" />
  </svg>;
}
function StepCard({ step, index, onOpen }) {
  const Icon = step.icon;
  return <button className="step-card" onClick={() => onOpen(step.id)}>
    <span className={`icon-circle ${index % 2 ? 'sage' : 'rose'}`}><Icon size={30} strokeWidth={1.8} /></span>
    <h3>{index + 1}. {step.title}</h3><p>{step.text}</p>
  </button>;
}
function EventCard({ event }) {
  const destination = encodeURIComponent(event.mapQuery || event.address);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  return <article className="event-card">
    <h3>{event.title}</h3>
    <div className="event-row"><span className="event-icon"><CalendarDays size={28} /></span><p><strong>{event.time}</strong><br />{event.date}</p></div>
    <a className="event-row event-location" href={event.mapUrl || directions} target="_blank" rel="noreferrer">
      <span className="event-icon"><MapPin size={28} /></span><p><strong>{event.venue}</strong><br />{event.address}</p>
    </a>
  </article>;
}
function CoverSlideshow({ photos }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reducedMotion || photos.length < 2) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % photos.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, photos.length]);
  return <div className={`cover-slideshow ${paused || reducedMotion ? 'is-paused' : ''}`}>
    {photos.map((photo, i) => <img key={`${photo}-${i}`} className={`hero-photo ${i === active ? 'is-active' : ''}`} src={photo}
      alt={i === active ? 'Cô dâu và chú rể trong ngày cưới' : ''} aria-hidden={i !== active} fetchPriority={i === 0 ? 'high' : 'low'} />)}
    {photos.length > 1 && !reducedMotion && <button className="cover-pause" onClick={() => setPaused(!paused)} aria-label={paused ? 'Tiếp tục chuyển ảnh bìa' : 'Tạm dừng chuyển ảnh bìa'} aria-pressed={paused}>
      {paused ? <Play size={16} /> : <Pause size={16} />}<span>{active + 1} / {photos.length}</span>
    </button>}
  </div>;
}
function Album({ photos }) {
  const slider = useRef(null);
  const [active, setActive] = useState(0);
  function goTo(index, fromGrid = false) {
    const target = Math.max(0, Math.min(index, photos.length - 1));
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    slider.current.scrollTo({ left: target * slider.current.clientWidth, behavior });
    if (fromGrid) slider.current.scrollIntoView({ block: 'nearest', behavior });
  }
  return <section className="photo-album" aria-label="Album ảnh cưới">
    <p className="muted">Vuốt ngang hoặc bấm mũi tên để xem ảnh. Cuộn xuống để xem toàn bộ album.</p>
    <div className="album-viewer">
      <div className="album-slider" ref={slider} tabIndex={0} role="region" aria-label="Ảnh cưới, dùng phím mũi tên trái và phải để chuyển ảnh"
        onScroll={e => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); goTo(active + (e.key === 'ArrowRight' ? 1 : -1)); } }}>
        {photos.map((photo, i) => <div className="album-slide" key={`${photo}-${i}`}><img src={photo} alt={`Ảnh cưới ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} /></div>)}
      </div>
      <button className="album-arrow previous" disabled={active === 0} onClick={() => goTo(active - 1)} aria-label="Ảnh trước"><ChevronLeft /></button>
      <button className="album-arrow next" disabled={active === photos.length - 1} onClick={() => goTo(active + 1)} aria-label="Ảnh tiếp theo"><ChevronRight /></button>
      <span className="album-count" aria-live="polite">{active + 1} / {photos.length}</span>
    </div>
    <div className="album-dots" aria-label="Chọn ảnh">{photos.map((_, i) => <button key={i} className={active === i ? 'selected' : ''} aria-label={`Xem ảnh ${i + 1}`} aria-pressed={active === i} onClick={() => goTo(i)} />)}</div>
    <div className="album-grid-heading"><h3>Tất cả khoảnh khắc</h3><span>{photos.length} ảnh</span></div>
    <div className="album-grid">{photos.map((photo, i) => <button key={`${photo}-${i}`} className={active === i ? 'selected' : ''} onClick={() => goTo(i, true)} aria-label={`Xem ảnh ${i + 1} ở khung lớn`} aria-pressed={active === i}>
      <img src={photo} alt={`Ảnh cưới ${i + 1}`} loading="lazy" /><span>{String(i + 1).padStart(2, '0')}</span>
    </button>)}</div>
  </section>;
}
function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    ref.current.showModal();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Đóng"><X /></button></div>
    {children}
  </dialog>;
}
export default function App() {
  const id = new URLSearchParams(window.location.search).get('wedding') ?? defaultWeddingId;
  const wedding = Object.hasOwn(weddings, id) ? weddings[id] : null;
  if (!wedding) return <main className="invitation map-content"><h1>Không tìm thấy thiệp cưới</h1><p>Vui lòng kiểm tra lại đường dẫn thiệp của bạn.</p><a className="primary-button" href="./">Mở thiệp mặc định</a></main>;
  return <WeddingInvitation key={id} id={id} wedding={wedding} />;
}

// Một giao diện dùng chung, dữ liệu của từng cặp đôi truyền qua props.
function WeddingInvitation({ id, wedding }) {
  const storageKey = kind => `wedding-${id}-${kind}`;
  const events = (wedding.events?.length ? wedding.events : [
    { id: 'meal', title: 'Bữa cơm thân mật được tổ chức' },
    { id: 'ceremony', title: 'Lễ thành hôn được tổ chức' },
  ]).map(event => ({ ...wedding, ...event }));
  const photos = (wedding.album?.length ? wedding.album : [wedding.photo]).map(assetUrl);
  const mapQuery = encodeURIComponent(wedding.mapQuery || wedding.address);
  const mapUrl = wedding.mapUrl || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}&travelmode=driving`;
  const [page, setPage] = useState('home');
  const [opened, setOpened] = useState(false);
  const invitationTitle = useRef(null);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40);
  const [notice, setNotice] = useState('');
  const [wishes, setWishes] = useState(() => readSaved(storageKey('wishes'), []));
  const [playing, setPlaying] = useState(false);
  const [tracks] = useState(() => (wedding.musicTracks?.length ? wedding.musicTracks : wedding.musicUrl ? [{ title: 'Nhạc cưới', url: wedding.musicUrl }] : []).map(track => ({ ...track, url: assetUrl(track.url) })));
  const [trackIndex, setTrackIndex] = useState(() => tracks.length ? Math.floor(Math.random() * tracks.length) : -1);
  const [musicError, setMusicError] = useState('');
  const audio = useRef(null);
  const currentTrack = useRef(trackIndex);
  const waitingForGesture = useRef(tracks.length > 0);
  const playRequest = useRef(0);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    document.title = `Thiệp cưới | ${wedding.groom} & ${wedding.bride}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Trân trọng kính mời dự lễ cưới ${wedding.groom} và ${wedding.bride}, ${wedding.date}, tại ${wedding.venue}.`);
  }, [wedding]);
  useEffect(() => {
    const player = audio.current;
    if (!tracks.length || !player) return;
    player.src = tracks[currentTrack.current].url;
    return () => {
      ++playRequest.current;
      player.pause();
    };
  }, [tracks]);
  useEffect(() => {
    if (opened) {
      invitationTitle.current?.focus({ preventScroll: true });
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [opened]);
  function openInvitation() {
    // Gọi play ngay trong thao tác của khách, trước khi cập nhật giao diện.
    playMusic();
    setOpened(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function open(id) {
    setMenu(false); setNotice(''); setPage(id);
    if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function closeDialog() {
    setNotice('');
    setPage('home');
  }
  function submit(e, kind) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.name = data.name.trim();
    if (!data.name || (kind === 'wishes' && !data.message.trim())) { setNotice('Vui lòng điền đầy đủ nội dung.'); return; }
    const value = kind === 'wishes' ? [...wishes, { ...data, message: data.message.trim() }] : data;
    try {
      localStorage.setItem(storageKey(kind), JSON.stringify(value));
      if (kind === 'wishes') setWishes(value);
      setNotice(kind === 'wishes' ? 'Đã lưu lời chúc của bạn trên thiết bị này. Cảm ơn bạn!' : 'Đã lưu xác nhận trên thiết bị này. Cảm ơn bạn!');
      e.currentTarget.reset();
    } catch { setNotice('Trình duyệt không thể lưu dữ liệu. Vui lòng thử lại.'); }
  }
  async function playMusic() {
    if (!audio.current || !tracks.length) return;
    const request = ++playRequest.current;
    setMusicError('');
    try {
      await audio.current.play();
      if (request === playRequest.current) waitingForGesture.current = false;
    } catch (error) {
      if (request !== playRequest.current || error.name === 'AbortError') return;
      waitingForGesture.current = error.name === 'NotAllowedError';
      if (!waitingForGesture.current) setMusicError('Không phát được bài này. Bạn hãy chọn bài khác.');
    }
  }
  function selectTrack(index) {
    if (!audio.current || !tracks[index]) return;
    if (index !== currentTrack.current || audio.current.ended) {
      currentTrack.current = index;
      setTrackIndex(index);
      audio.current.src = tracks[index].url;
      audio.current.load();
    }
    playMusic();
  }
  function nextTrack() {
    if (!tracks.length) return;
    // Chọn ngẫu nhiên trong các bài còn lại, không lặp ngay bài vừa phát.
    const offset = tracks.length > 1 ? 1 + Math.floor(Math.random() * (tracks.length - 1)) : 0;
    selectTrack((currentTrack.current + offset) % tracks.length);
  }
  function toggleMusic() {
    if (!audio.current) return;
    if (!audio.current.paused) {
      waitingForGesture.current = false;
      ++playRequest.current;
      audio.current.pause();
    } else playMusic();
  }
  const titles = { rsvp: 'Xác nhận tham dự', map: 'Đường đến lễ cưới', album: 'Khoảnh khắc yêu thương', wishes: 'Gửi lời chúc', music: 'Giai điệu ngày chung đôi' };
  return <main className="invitation">
    {!opened && <section className="invitation-welcome" aria-labelledby="welcome-title">
      <div className="welcome-envelope" aria-hidden="true">💌</div>
      <p className="eyebrow">TRÂN TRỌNG KÍNH MỜI</p>
      <h1 id="welcome-title">{wedding.groom}<span>&</span>{wedding.bride}</h1>
      <Divider />
      <p className="welcome-message">Một lời mời nhỏ, một ngày thật đặc biệt.<br />Mời bạn mở thiệp và chung vui cùng chúng mình.</p>
      <button className="primary-button welcome-open" onClick={openInvitation} autoFocus><Heart size={20} fill="currentColor" />Mở thiệp 💌</button>
      {tracks.length > 0 && <p className="welcome-music-hint"><Music2 size={15} />Nhạc cưới sẽ phát khi bạn mở thiệp</p>}
    </section>}
    <div className="invitation-content" hidden={!opened}>
    {opened && <WelcomeConfetti />}
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}><a className="brand" href="#home" onClick={() => open('home')}><Heart size={23} fill="currentColor" /><span>Thiệp Cưới</span></a>
      <button className="icon-button" aria-label="Mở menu" aria-expanded={menu} aria-controls="header-menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
      {menu && <nav id="header-menu" className="dropdown">{navigation.map(item => <button key={item.id} onClick={() => open(item.id)}>{item.label}</button>)}</nav>}
    </header>
    <section className="hero" id="home">
      <CoverSlideshow photos={(wedding.coverPhotos?.length ? wedding.coverPhotos : [wedding.photo]).map(assetUrl)} />
      <div className="hero-content"><p className="eyebrow">TRÂN TRỌNG KÍNH MỜI</p><p className="intro">Quý khách tham dự lễ thành hôn của</p>
        <h1 ref={invitationTitle} tabIndex={-1}><span>{wedding.groom}</span><Divider /><span>{wedding.bride}</span></h1>
        <div className="families">{wedding.families.map(family => <article key={family.title}><h3>{family.title}</h3><p>{family.father}<br />{family.mother}</p><div className="family-address"><MapPin size={19} /><p>{family.address}</p></div></article>)}</div>
      </div>
    </section>
    <section className="event" aria-label="Thời gian và địa điểm lễ cưới">
      <div className="event-columns">{events.map(event => <EventCard key={event.id} event={event} />)}</div>
      <MapPreview href={directionsUrl} venue={wedding.venue} />
      <p className="welcome">Rất hân hạnh được đón tiếp !</p><Divider /><Flower /><Flower flip />
    </section>
    <section className="guide"><h2><Leaf aria-hidden="true" /><span>Hướng dẫn thao tác</span><Leaf aria-hidden="true" /></h2>
      <p className="guide-intro">Để tham dự buổi lễ, Quý khách vui lòng thực hiện theo<br className="desktop-break" /> các bước dưới đây:</p>
      <div className="steps">{steps.map((step, index) => <StepCard key={step.id} step={step} index={index} onOpen={open} />)}</div>
      <button className="primary-button" onClick={() => open('rsvp')}><Heart size={19} fill="currentColor" />Xác nhận tham dự ngay<ChevronRight size={19} /></button>
    </section>
    <footer className="footer"><p><Leaf size={22} />Cảm ơn bạn đã đồng hành cùng chúng tôi!<Leaf size={22} /></p><Divider /></footer>
    <nav className="bottom-nav" aria-label="Điều hướng chính">{navigation.map(({ id, icon: Icon, label }) => <button key={id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => open(id)}><Icon size={24} fill={id === 'home' && page === id ? 'currentColor' : 'none'} /><span>{label}</span></button>)}</nav>
    <audio ref={audio} preload="metadata" onEnded={nextTrack} onPlay={() => { waitingForGesture.current = false; setPlaying(true); }} onPause={() => setPlaying(false)}
      onError={() => { waitingForGesture.current = false; setPlaying(false); setMusicError('Không tải được bài này. Bạn hãy chọn bài khác.'); }} />
    {tracks.length > 0 && <button className="music-toggle" data-music-control onClick={toggleMusic} aria-label={playing ? 'Tạm dừng nhạc cưới' : 'Phát nhạc cưới'} title={tracks[trackIndex]?.title}>
      {playing ? <Pause size={20} /> : <Play size={20} />}<span>{playing ? 'Tạm dừng nhạc' : 'Phát nhạc'}</span>
    </button>}
    {page !== 'home' && <Modal key={page} title={titles[page]} className={page === 'album' ? 'album-modal' : ''} onClose={closeDialog}>
      {page === 'rsvp' && <form onSubmit={e => submit(e, 'rsvp')} className="form"><p>Hẹn gặp bạn trong ngày chung đôi của chúng mình.</p><label>Họ và tên<input name="name" autoComplete="name" required placeholder="Tên của bạn" maxLength={80} /></label><label>Bạn sẽ tham dự chứ?<select name="attendance"><option value="yes">Mình sẽ đến chung vui</option><option value="no">Tiếc quá, mình không thể đến</option></select></label><label>Số người tham dự<input name="guests" type="number" min="1" max="20" defaultValue="1" required /></label><button className="primary-button" type="submit"><Check size={18} />Lưu xác nhận</button><small>Bản mẫu: thông tin chỉ lưu trên trình duyệt này, chưa gửi đến cô dâu chú rể.</small></form>}
      {page === 'map' && <div className="map-content">
        <h3>{wedding.venue}</h3><p>{wedding.address}</p>
        <MapPreview href={directionsUrl} venue={wedding.venue} />
        <a className="primary-button" href={directionsUrl} target="_blank" rel="noreferrer">Xem đường đi trên Google Maps<ChevronRight size={18} /></a>
      </div>}
      {page === 'album' && <Album photos={photos} />}
      {page === 'wishes' && <><form className="form" onSubmit={e => submit(e, 'wishes')}><label>Họ và tên<input name="name" autoComplete="name" placeholder="Tên của bạn" maxLength={80} required /></label><label>Lời chúc<textarea name="message" placeholder="Chúc hai bạn trăm năm hạnh phúc…" rows={3} maxLength={1000} required /></label><button className="primary-button" type="submit"><Heart size={18} />Lưu lời chúc</button><small>Lời chúc chỉ hiển thị trên trình duyệt này.</small></form><div className="wishes">{wishes.map((wish, i) => <article key={i}><strong>{wish.name}</strong><p>{wish.message}</p></article>)}</div></>}
      {page === 'music' && <div className="music-content" data-music-control><span className="icon-circle rose"><Music2 size={30} /></span>
        <p>Chọn bài hát bạn muốn nghe cùng thiệp cưới.<br />Hết bài, nhạc tự chuyển ngẫu nhiên sang bài khác.</p>
        <div className="music-track-list" aria-label="Danh sách nhạc cưới">{tracks.map((track, index) => <button key={track.url} className={`music-track ${index === trackIndex ? 'selected' : ''}`} aria-pressed={index === trackIndex} onClick={() => selectTrack(index)}>
          <span className="music-track-number">{index === trackIndex && playing ? <Music2 size={18} /> : String(index + 1).padStart(2, '0')}</span>
          <span>{track.title}</span>{index === trackIndex ? <Check size={18} /> : <Play size={16} />}
        </button>)}</div>
        {tracks.length > 0 ? <><p className="music-status" role="status">{playing ? 'Đang phát' : 'Đã chọn'}: <strong>{tracks[trackIndex]?.title}</strong></p>
          <div className="music-actions"><button className="primary-button" onClick={toggleMusic}>{playing ? <Pause size={19} /> : <Play size={19} />}{playing ? 'Tạm dừng' : 'Phát nhạc'}</button>
            <button className="primary-button" onClick={nextTrack}>Bài tiếp theo<ChevronRight size={19} /></button></div></> : <p>Chưa có nhạc cho thiệp này.</p>}
        {musicError && <p className="notice" role="alert">{musicError}</p>}
      </div>}
      {notice && <p className="notice" role="status">{notice}</p>}
    </Modal>}
    </div>
  </main>;
}
