export function vietnamDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = type => parts.find(part => part.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function nextDay(value) {
  return new Date(Date.parse(`${value}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
}
export function wishDateBounds(mode, day, start, end, now = new Date()) {
  if (mode === 'all') return {};
  const today = vietnamDate(now);
  let first, last;
  if (mode === 'today') first = last = today;
  else if (mode === 'day') first = last = day;
  else if (mode === 'range') { first = start; last = end; }
  else if (mode === 'month') {
    first = `${today.slice(0, 7)}-01`;
    const [year, month] = first.split('-').map(Number);
    last = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  } else return { error: 'Bộ lọc ngày không hợp lệ.' };
  if (!validDate(first || '') || !validDate(last || '')) return { error: 'Bạn chọn đủ ngày để lọc lời chúc nhé.' };
  if (first > last) return { error: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.' };
  return { from: `${first}T00:00:00+07:00`, to: `${nextDay(last)}T00:00:00+07:00` };
}
export function filterRsvps(rows, mode) {
  return rows.filter(row => {
    if (mode === 'all') return true;
    if (!row.attendance) return false;
    const meal = row.events.includes('meal'); const ceremony = row.events.includes('ceremony');
    if (mode === 'both') return meal && ceremony;
    if (mode === 'meal') return meal && !ceremony;
    if (mode === 'ceremony') return ceremony && !meal;
    return false;
  });
}
