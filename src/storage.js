const KEY = "date-booking-data";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { attempts: [], bookings: [], prizes: [] };
  } catch {
    return { attempts: [], bookings: [], prizes: [] };
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  // push to the shared server store so every device sees it
  // (keepalive so time-tracking flushes survive tab close)
  return fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => {});
}

// pull the server copy (source of truth) into localStorage before the app renders
export async function syncFromServer() {
  try {
    const r = await fetch("/api/data");
    if (!r.ok) return;
    const remote = await r.json();
    if (remote && Array.isArray(remote.bookings)) {
      localStorage.setItem(KEY, JSON.stringify(remote));
    }
  } catch { /* offline / static hosting — stay on local data */ }
}

// every write re-pulls the server copy first, so a tab with stale data
// can't clobber what another tab or device saved in the meantime.
// Writes are queued one after another: two concurrent mutations (e.g. a
// booking save and a stats flush) would otherwise read the same base and
// the later POST would erase the earlier one's change.
let writeQueue = Promise.resolve();

function mutate(fn) {
  writeQueue = writeQueue
    .then(async () => {
      await syncFromServer();
      const data = load();
      fn(data);
      await save(data);
    })
    .catch(() => {});
  return writeQueue;
}

export function logAttempt(question, answer, correct) {
  mutate((d) => {
    d.attempts.push({ question, answer, correct, at: new Date().toISOString() });
  });
}

export function saveBooking(booking) {
  mutate((d) => {
    d.bookings.push({ ...booking, at: new Date().toISOString() });
  });
}

// scratched-open surprise — so Boby knows what he owes
export function savePrize(prize) {
  mutate((d) => {
    d.prizes = d.prizes || [];
    d.prizes.push({ prize, at: new Date().toISOString() });
  });
}

export function deleteBooking(at) {
  mutate((d) => {
    d.bookings = d.bookings.filter((b) => b.at !== at);
  });
}

export function getAll() {
  return load();
}

export function getBookedDates() {
  const data = load();
  return [...new Set(data.bookings.flatMap((b) => b.dates || []))].sort();
}

export function clearAll() {
  // through the queue so a pending stats flush can't resurrect old data
  writeQueue = writeQueue
    .then(() => save({ attempts: [], bookings: [], prizes: [] }))
    .catch(() => {});
  return writeQueue;
}

// ---------- usage statistics (visits, time on site, time per screen) ----------

function statsOf(data) {
  data.stats = data.stats || { visits: 0, totalSeconds: 0, screens: {} };
  data.stats.screens = data.stats.screens || {};
  return data.stats;
}

export function trackVisit() {
  mutate((d) => {
    const stats = statsOf(d);
    stats.visits += 1;
    stats.lastVisit = new Date().toISOString();
  });
}

export function trackHeartOpen() {
  mutate((d) => {
    const stats = statsOf(d);
    stats.heartOpens = (stats.heartOpens || 0) + 1;
  });
}

// screen may be null (animation screens): counts toward total time only
export function trackTime(screen, seconds) {
  if (!seconds || seconds <= 0) return;
  mutate((d) => {
    const stats = statsOf(d);
    stats.totalSeconds += seconds;
    if (screen) stats.screens[screen] = (stats.screens[screen] || 0) + seconds;
  });
}

// "days together" counter resumed at runtime — kept in the shared store
// (synced via /api/data) so every device agrees; config resumedFrom
// stays the source of truth if set
export function getResumedFrom() {
  return load().resumedFrom || "";
}

export function setResumedFrom(date) {
  return mutate((d) => { d.resumedFrom = date; });
}

export function clearResumedFrom() {
  return mutate((d) => { d.resumedFrom = ""; });
}
