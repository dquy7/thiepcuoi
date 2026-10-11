import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRsvps, vietnamDate, wishDateBounds } from './admin-filters.js';

test('four event choices separate single-event guests from both and preserve declines in all', () => {
  const rows = [
    { id: 'meal', attendance: true, events: ['meal'] },
    { id: 'ceremony', attendance: true, events: ['ceremony'] },
    { id: 'both', attendance: true, events: ['meal', 'ceremony'] },
    { id: 'declined', attendance: false, events: [] },
  ];
  assert.equal(filterRsvps(rows, 'all').length, 4);
  for (const mode of ['meal', 'ceremony', 'both']) assert.deepEqual(filterRsvps(rows, mode).map(row => row.id), [mode]);
});

test('Vietnam day switches at 17:00 UTC and filters include the whole local day', () => {
  assert.equal(vietnamDate(new Date('2026-10-10T16:59:59Z')), '2026-10-10');
  assert.equal(vietnamDate(new Date('2026-10-10T17:00:00Z')), '2026-10-11');
  const bounds = wishDateBounds('today', '', '', '', new Date('2026-10-10T17:00:00Z'));
  assert.equal(new Date(bounds.from).toISOString(), '2026-10-10T17:00:00.000Z');
  assert.equal(new Date(bounds.to).toISOString(), '2026-10-11T17:00:00.000Z');
});

test('range includes final day, month handles leap years and December rollover', () => {
  assert.deepEqual(wishDateBounds('range', '', '2026-10-01', '2026-10-11'), { from: '2026-10-01T00:00:00+07:00', to: '2026-10-12T00:00:00+07:00' });
  assert.deepEqual(wishDateBounds('day', '2026-10-11'), { from: '2026-10-11T00:00:00+07:00', to: '2026-10-12T00:00:00+07:00' });
  assert.deepEqual(wishDateBounds('month', '', '', '', new Date('2028-02-15T00:00:00Z')), { from: '2028-02-01T00:00:00+07:00', to: '2028-03-01T00:00:00+07:00' });
  assert.deepEqual(wishDateBounds('month', '', '', '', new Date('2026-12-15T00:00:00Z')), { from: '2026-12-01T00:00:00+07:00', to: '2027-01-01T00:00:00+07:00' });
});

test('empty, impossible and reversed dates are rejected; all days has no bounds', () => {
  assert.ok(wishDateBounds('day', '').error);
  assert.ok(wishDateBounds('day', '2026-02-30').error);
  assert.ok(wishDateBounds('range', '', '2026-10-12', '2026-10-11').error);
  assert.deepEqual(wishDateBounds('all'), {});
});
