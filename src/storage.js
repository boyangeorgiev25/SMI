const KEY = "date-booking-data";

// Where the shared copy lives. In `npm run dev` the Vite plugin in
// vite.config.js serves /api/data from data.json on this machine. For a
// hosted build there is no such server, so set VITE_DATA_URL in .env to a
// hosted JSON endpoint (e.g. a Firebase Realtime Database URL ending in
// .json) — see .env.example.
const REMOTE = import.meta.env.VITE_DATA_URL || "/api/data";
// Most stores replace the document on PUT; npoint.io only accepts POST.
const IS_NPOINT = REMOTE.includes("npoint.io");
const WRITE_METHOD = IS_NPOINT ? "POST" : "PUT";
// npoint accepts text/plain bodies; that makes the write a "simple" CORS
// request (no preflight), which keeps keepalive flushes reliable on tab close.
const WRITE_TYPE = IS_NPOINT ? "text/plain" : "application/json";

// npoint (and other CDN-fronted stores) cache GETs for up to an hour, so a
// plain read after a write can return the OLD document and the next write
// would silently drop the new data. A unique query string forces a fresh read.
function readUrl() {
  return REMOTE + (REMOTE.includes("?") ? "&" : "?") + "t=" + Date.now();
}

// true / false after the first sync attempt, null before it
let lastSyncOk = null;
export function getSyncStatus() {
  return { ok: lastSyncOk, url: REMOTE, isRemote: REMOTE !== "/api/data" };
}

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
  return fetch(REMOTE, {
    method: WRITE_METHOD, // PUT replaces the whole document (Firebase POST would append a child)
    headers: { "Content-Type": WRITE_TYPE },
    body: JSON.stringify(data),
    keepalive: true,
  })
    .then((r) => { lastSyncOk = r.ok; })
    .catch(() => { lastSyncOk = false; });
}

// pull the server copy (source of truth) into localStorage before the app renders
export async function syncFromServer() {
  try {
    const r = await fetch(readUrl(), { cache: "no-store" });
    lastSyncOk = r.ok;
    if (!r.ok) return;
    const remote = await r.json(); // Firebase returns null for an empty path
    if (remote && Array.isArray(remote.bookings)) {
      localStorage.setItem(KEY, JSON.stringify(remote));
    }
  } catch { lastSyncOk = false; /* offline / static hosting — stay on local data */ }
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
