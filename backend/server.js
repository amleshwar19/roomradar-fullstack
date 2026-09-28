// RoomRadar backend — Express API + static frontend
const express = require('express');
const path = require('path');
const D = require('./data');
const NLP = require('./nlp');

const app = express();
app.use(express.json());

// ---- time helpers (Asia/Kolkata) ----
function istNow() {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return { jsDay: ist.getDay(), min: ist.getHours() * 60 + ist.getMinutes() };
}
const jsDayToIdx = js => (js === 0 || js === 6 ? -1 : js - 1); // Mon..Fri -> 0..4, weekend -> -1

// ---- API ----
app.get('/api/health', (req, res) => {
  const t = istNow();
  res.json({ ok: true, ist: { jsDay: t.jsDay, min: t.min, label: D.fmtT(t.min) } });
});

app.get('/api/meta', (req, res) => {
  res.json({
    floors: D.FLOORS,
    days: D.DAYS,
    periods: D.PERIODS.map(p => ({ n: p.n, start: D.fmtT(p.s), end: D.fmtT(p.e) })),
    dayStart: D.fmtT(540), dayEnd: D.fmtT(1010)
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(D.ROOMS.map(r => ({
    no: r.no, floor: r.floor, cap: r.cap, ac: r.ac, proj: r.proj,
    sections: r.secs.map(s => D.secById(s).label)
  })));
});

app.get('/api/examples', (req, res) => res.json(NLP.EXAMPLES));

// Availability snapshot for a day/time/duration
app.get('/api/availability', (req, res) => {
  const day = parseInt(req.query.day, 10);           // 0..4, -1 = weekend
  const time = Math.max(0, parseInt(req.query.time, 10) || 0);
  const dur = Math.max(15, parseInt(req.query.duration, 10) || 60);
  const out = D.ROOMS.map(r => {
    const b = D.roomBusyAt(r, day, time);
    const fits = D.roomFreeFor(r, day, time, time + dur);
    return {
      no: r.no, floor: r.floor, cap: r.cap, ac: r.ac, proj: r.proj,
      busy: !!b,
      busyInfo: b ? {
        section: D.secById(b.secId).label,
        subject: D.slotName(b.secId, b.slot),
        until: D.fmtT(D.busyUntil(r, day, time))
      } : null,
      freeUntil: D.fmtT(D.freeUntil(r, day, time)),
      fitsWindow: fits
    };
  });
  res.json({ day, time: D.fmtT(time), duration: dur, rooms: out });
});

// Full day schedule + free windows for one room
app.get('/api/rooms/:no/schedule', (req, res) => {
  const r = D.ROOMS.find(x => x.no === req.params.no);
  if (!r) return res.status(404).json({ error: 'unknown room' });
  const day = parseInt(req.query.day, 10);
  const dayLabel = day < 0 || day > 4 ? 'Weekend' : D.DAYS[day];
  const periods = D.PERIODS.map(P => {
    const b = D.roomBusyAt(r, day, P.s + 1);
    return {
      n: P.n, start: D.fmtT(P.s), end: D.fmtT(P.e), busy: !!b,
      section: b ? D.secById(b.secId).label : null,
      subject: b ? D.slotName(b.secId, b.slot) : null
    };
  });
  const freeWindows = D.freeWindows(r, day).map(w => ({ start: D.fmtT(w.s), end: D.fmtT(w.e) }));
  res.json({
    room: { no: r.no, floor: r.floor, cap: r.cap, ac: r.ac, proj: r.proj, sections: r.secs.map(s => D.secById(s).label) },
    day, dayLabel, periods, freeWindows
  });
});

// AI natural-language search
app.post('/api/search', (req, res) => {
  const q = String(req.body.query || '').trim();
  if (!q) return res.status(400).json({ error: 'empty query' });
  const t = istNow();
  const p = NLP.parseQuery(q, Math.max(t.min, 540));
  const day = NLP.resolveDay(p, t.jsDay);
  const start = Math.min(Math.max(p.startMin, 540), 1010);
  const end = Math.min(start + p.durMin, 1010);

  let note = null;
  if (p.floors && p.floors.every(f => !D.FLOORS.includes(f))) {
    note = `The dataset has no ${p.floors.includes(0) ? 'ground-floor ' : ''}rooms — tracked floors are ${D.FLOORS.join(', ')}. Showing closest matches on available floors instead.`;
    p.floors = null;
  }

  const matches = [], nearMiss = [];
  for (const r of D.ROOMS) {
    if (p.floors && !p.floors.includes(r.floor)) { nearMiss.push({ no: r.no, floor: r.floor, why: `on floor ${r.floor}, not ${p.floors.join('/')}` }); continue; }
    if (r.cap < p.minCap) { nearMiss.push({ no: r.no, floor: r.floor, why: `only ${r.cap} seats (need ${p.minCap})` }); continue; }
    if (p.ac && !r.ac) { nearMiss.push({ no: r.no, floor: r.floor, why: 'no AC' }); continue; }
    if (p.proj && !r.proj) { nearMiss.push({ no: r.no, floor: r.floor, why: 'no projector' }); continue; }
    if (!D.roomFreeFor(r, day, start, end)) {
      const b = D.roomBusyAt(r, day, start);
      nearMiss.push({ no: r.no, floor: r.floor, why: b ? `occupied ${D.fmtT(start)}–${D.fmtT(D.busyUntil(r, day, start))} by ${D.secById(b.secId).label}` : 'partially occupied in the requested window' });
      continue;
    }
    const reasons = [];
    if (p.floors) reasons.push(`floor ${r.floor} ✓`);
    reasons.push(`free ${D.fmtT(start)}–${D.fmtT(end)} ✓`);
    reasons.push(`${r.cap} seats ✓`);
    if (p.ac) reasons.push('AC ✓');
    if (p.proj) reasons.push('projector ✓');
    matches.push({ no: r.no, floor: r.floor, cap: r.cap, reasons });
  }

  res.json({
    intent: {
      floors: p.floors, durMin: p.durMin, minCap: p.minCap, ac: p.ac, proj: p.proj,
      startMin: start, startLabel: D.fmtT(start), endLabel: D.fmtT(end),
      day, dayLabel: day < 0 ? 'weekend' : D.DAYS[day], notes: p.notes
    },
    note, matches, nearMiss: nearMiss.slice(0, 4)
  });
});

// ---- static frontend ----
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RoomRadar backend live → http://localhost:${PORT}`));
