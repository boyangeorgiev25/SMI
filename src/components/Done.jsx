import { CONFIG } from "../config.js";
import { formatDate, formatHours } from "./Activities.jsx";
import Countdown from "./Countdown.jsx";
import LoveLetter from "./LoveLetter.jsx";

export function locText(loc) {
  return typeof loc === "string" ? loc : loc?.address;
}

export function mapsLink(loc) {
  if (typeof loc === "object" && loc?.lat) return `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
  return null;
}

export function allActivities(booking) {
  const main = CONFIG.activities.filter((a) => (booking.activities || []).includes(a.id));
  const customs = (booking.customActivities || []).map((c) => ({ ...c, emoji: c.emoji || "✨" }));
  return [...main, ...customs];
}

function icsEscape(t) {
  return String(t).replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
}

function buildICS(booking, acts, total) {
  const plan = acts.map((a) => `${a.emoji} ${a.label}`).join(", ");
  const [hh, mm] = (booking.hour || "19:00").split(":").map(Number);
  const events = booking.dates.map((d, i) => {
    const [y, mo, day] = d.split("-").map(Number);
    const start = new Date(y, mo - 1, day, hh, mm);
    const end = new Date(start.getTime() + Math.max(total, 1) * 3600000);
    const fmt = (x) =>
      `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T` +
      `${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
    return [
      "BEGIN:VEVENT",
      `UID:date-${booking.at || d}-${i}@bookourdate`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${icsEscape(`Среща с ${CONFIG.yourName} 💘`)}`,
      `LOCATION:${icsEscape(locText(booking.location) || "")}`,
      `DESCRIPTION:${icsEscape(`План: ${plan} (~${formatHours(total)})`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookOurDate//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function Done({ booking, onReview, onBookAnother }) {
  const acts = allActivities(booking);
  const total = acts.reduce((s, a) => s + a.hours, 0);
  const icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(buildICS(booking, acts, total));

  return (
    <div className="screen">
      <div className="done-head">
        <h1>Имаме среща! 🎉</h1>
        <p className="sub">{CONFIG.yourName} няма търпение 😏 · запазено ✅</p>
      </div>

      <Countdown booking={booking} />

      <div className="card summary-v2">
        <div className="sum-item">
          <span className="sum-label">📅 Ден</span>
          <div className="sum-chips">
            {booking.dates.map((d) => <span key={d} className="date-chip">{formatDate(d)}</span>)}
          </div>
        </div>

        <div className="sum-item">
          <span className="sum-label">🎯 План</span>
          <div className="sum-chips">
            {acts.map((a, i) => (
              <span key={i} className="date-chip plan-chip">{a.emoji} {a.label} · {formatHours(a.hours)}</span>
            ))}
          </div>
        </div>

        <div className="sum-stats">
          <div className="sum-stat">
            <span className="sum-label">🕗 Среща в</span>
            <span className="sum-big">{booking.hour}</span>
          </div>
          <div className="sum-stat">
            <span className="sum-label">⏱ Общо време</span>
            <span className="sum-big">~{formatHours(total)}</span>
          </div>
        </div>

        <div className="sum-item">
          <span className="sum-label">📍 Къде</span>
          <p className="sum-addr">{locText(booking.location)}</p>
          {mapsLink(booking.location) && (
            <a className="inline-link" href={mapsLink(booking.location)} target="_blank" rel="noreferrer">
              Отвори в Google Maps 🗺️
            </a>
          )}
        </div>
      </div>

      <LoveLetter />

      <a className="btn" href={icsHref} download="our-date.ics">Добави в календара си 📆</a>
      <div className="btn-row">
        <button className="btn ghost" onClick={onBookAnother}>Запази още една 💘</button>
        <button className="btn ghost" onClick={onReview}>Всички наши срещи 📋</button>
      </div>
    </div>
  );
}

