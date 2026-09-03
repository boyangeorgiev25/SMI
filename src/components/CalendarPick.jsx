import { useEffect, useState } from "react";
import { getAll, getBookedDates } from "../storage.js";
import { CONFIG } from "../config.js";
import { formatDate, formatHours } from "./Activities.jsx";
import { allActivities, locText, mapsLink } from "./Done.jsx";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const TITLES = ["Избери ден 📆", "Избери нашия ден ❤️", "Всеки ден с теб 🥰", "Тик-так… 😏"];
const MONTHS = [
  "Януари", "Февруари", "Март", "Април", "Май", "Юни",
  "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември",
];

function toKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPick({ onDone, initial }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(initial || []);
  const booked = getBookedDates(); // read fresh each render so clears/cancels show immediately
  const [titleIdx, setTitleIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setTitleIdx((t) => (t + 1) % TITLES.length);
        setFading(false);
      }, 500);
    }, 3400);
    return () => clearInterval(iv);
  }, []);
  const [viewDate, setViewDate] = useState(null);
  const viewBookings = viewDate
    ? getAll().bookings.filter((b) => (b.dates || []).includes(viewDate))
    : [];

  const first = new Date(view.y, view.m, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth();

  function isAvailable(key) {
    return key >= todayKey && key >= CONFIG.availableFrom && key <= CONFIG.availableTo;
  }

  function toggle(day) {
    const key = toKey(view.y, view.m, day);
    if (booked.includes(key)) { setViewDate(key); return; }
    if (!isAvailable(key)) return;
    setSelected((s) => (s.includes(key) ? [] : [key])); // single choice — new pick replaces the old
  }

  function nav(dir) {
    setView((v) => {
      let m = v.m + dir, y = v.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  }

  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="screen cal-screen">
      <h1 className={`cal-h1 ${fading ? "fading" : ""}`}>{TITLES[titleIdx]}</h1>

      <div className="cal-middle">
      <div className="card cal-card">
        <div className="cal-nav">
          <button className="cal-btn" onClick={() => nav(-1)} disabled={isCurrentMonth}>‹</button>
          <span className="cal-title">{MONTHS[view.m]} {view.y}</span>
          <button className="cal-btn" onClick={() => nav(1)}>›</button>
        </div>
        <div className="cal-grid cal-days">
          {DAYS.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="cal-grid">
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const key = toKey(view.y, view.m, day);
            const unavailable = !isAvailable(key);
            const sel = selected.includes(key);
            const isBooked = booked.includes(key);
            return (
              <button
                key={key}
                className={`cal-day ${sel ? "sel" : ""} ${unavailable ? "past" : ""} ${key === todayKey ? "today" : ""} ${isBooked ? "booked" : ""}`}
                onClick={() => toggle(day)}
                disabled={unavailable && !isBooked}
              >
                {isBooked ? "💘" : day}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length === 1 && (
        <p className="hint ok pop">Перфектно 💪</p>
      )}
      <button className="btn" disabled={selected.length !== 1} onClick={() => onDone(selected)}>
        {selected.length !== 1 ? "Избери дата…" : "Продължи →"}
      </button>
      </div>

      {viewDate && (
        <div className="modal-overlay" onClick={() => setViewDate(null)}>
          <div className="modal booked-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">💘</div>
            <h2>Запазено: {formatDate(viewDate)}</h2>
            {viewBookings.map((b) => {
              const acts = allActivities(b);
              return (
                <div key={b.at} className="card summary-card booked-detail">
                  <div className="sum-row"><span>📅 Ден</span><b>{b.dates.map(formatDate).join(" · ")}</b></div>
                  <div className="sum-row"><span>🎯 План</span><b>{acts.map((a) => `${a.emoji} ${a.label}`).join(", ")}</b></div>
                  <div className="sum-row"><span>⏱ Време</span><b>~{formatHours(acts.reduce((t, a) => t + a.hours, 0))}</b></div>
                  <div className="sum-row"><span>🕗 Час</span><b>{b.hour}</b></div>
                  <div className="sum-row"><span>📍 Къде</span><b>{locText(b.location)}</b></div>
                  {mapsLink(b.location) && (
                    <a className="inline-link" href={mapsLink(b.location)} target="_blank" rel="noreferrer">
                      Отвори в Google Maps 🗺️
                    </a>
                  )}
                </div>
              );
            })}
            <button className="btn ghost" onClick={() => setViewDate(null)}>Затвори</button>
          </div>
        </div>
      )}
    </div>
  );
}
