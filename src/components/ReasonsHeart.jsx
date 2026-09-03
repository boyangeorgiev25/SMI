import { useEffect, useState } from "react";
import { CONFIG } from "../config.js";
import { togetherMs } from "./Authorized.jsx";
import { getResumedFrom, setResumedFrom, syncFromServer, trackHeartOpen } from "../storage.js";

const HEARTS = ["💘", "💕", "💗", "💓", "💞", "❤️", "💖", "💝"];

function formatFullDate(key) {
  return new Date(key).toLocaleDateString("bg-BG", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function ReasonsHeart() {
  const [open, setOpen] = useState(false);
  const [resumed, setResumed] = useState(() => Boolean(CONFIG.resumedFrom || getResumedFrom()));
  const [now, setNow] = useState(() => Date.now());
  const paused = Boolean(CONFIG.pausedFrom) && !resumed;

  // tick every second while the widget is open and the counter is running
  useEffect(() => {
    if (!open || paused) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [open, paused]);

  const [burst, setBurst] = useState(null);

  function resume() {
    setResumedFrom(new Date().toISOString());
    setNow(Date.now());
    setResumed(true);
    // the revival: screen dims, the heart beats back to life, then explodes
    setBurst(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
        dx: (Math.random() * 2 - 1) * 200,
        dy: (Math.random() * 2 - 1) * 320 - 50,
        size: 18 + Math.random() * 22,
        delay: 1.55 + Math.random() * 0.4, // after the heart comes alive
      }))
    );
    try { navigator.vibrate?.([60, 110, 60, 110, 160]); } catch { /* fine */ }
    setTimeout(() => setBurst(null), 4600);
  }

  function close() {
    setOpen(false);
  }

  const ms = togetherMs(now);
  const days = Math.floor(ms / 86400000);
  const hh = Math.floor((ms % 86400000) / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  const ss = Math.floor((ms % 60000) / 1000);

  return (
    <>
      <button
        type="button"
        className="reasons-fab attention"
        onClick={() => {
          setOpen(true);
          trackHeartOpen();
          // re-read on open — resume/pause may have changed elsewhere (admin, other device)
          syncFromServer().then(() => {
            setResumed(Boolean(CONFIG.resumedFrom || getResumedFrom()));
            setNow(Date.now());
          });
        }}
        aria-label="Времето ни заедно"
      >
        ❤️
      </button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal days-modal" onClick={(e) => e.stopPropagation()}>
            <div className="days-big">{days.toLocaleString("bg-BG")}</div>
            <div className="days-label">дни заедно</div>
            <div className="days-clock">
              <div className="days-cell"><b>{hh}</b><span>часа</span></div>
              <div className="days-cell"><b>{String(mm).padStart(2, "0")}</b><span>мин</span></div>
              <div className="days-cell"><b>{String(ss).padStart(2, "0")}</b><span>сек</span></div>
            </div>
            <p className="days-since">заедно от {formatFullDate(CONFIG.togetherFrom)} ❤️</p>

            {paused ? (
              <>
                <div className="days-paused">
                  <span className="days-paused-main">Времето ни спря на {formatFullDate(CONFIG.pausedFrom)}</span>
                  <span className="days-paused-sub">…но само ти можеш да го пуснеш отново 😏</span>
                </div>
                <button className="btn spin-ring" onClick={resume}>▶ Пусни времето отново</button>
              </>
            ) : (
              <p className="days-note">и броим нататък 😏</p>
            )}

            <button className="btn-link" onClick={close}>затвори</button>
          </div>
        </div>
      )}

      {burst && (
        <div className="resume-burst">
          <div className="burst-flash" />
          <span className="shock s1" />
          <span className="shock s2" />
          <span className="shock s3" />
          {burst.map((h) => (
            <span
              key={h.id}
              className="burst-heart"
              style={{
                "--dx": `${h.dx}px`,
                "--dy": `${h.dy}px`,
                fontSize: `${h.size}px`,
                animationDelay: `${h.delay}s`,
              }}
            >
              {h.emoji}
            </span>
          ))}
          <div className="burst-center">💘</div>
          <div className="burst-text">времето тече отново…</div>
        </div>
      )}
    </>
  );
}
