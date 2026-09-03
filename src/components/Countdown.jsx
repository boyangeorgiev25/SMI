import { useEffect, useState } from "react";

function nextTarget(booking, now) {
  const [hh, mm] = (booking.hour || "19:00").split(":").map(Number);
  const times = (booking.dates || [])
    .map((d) => {
      const [y, mo, day] = d.split("-").map(Number);
      return new Date(y, mo - 1, day, hh, mm).getTime();
    })
    .sort((a, b) => a - b);
  return times.find((t) => t > now) ?? times[times.length - 1] ?? null;
}

const LABELS = ["дни", "часа", "мин", "сек"];

export default function Countdown({ booking }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const target = nextTarget(booking, now);
  if (!target) return null;

  const diff = target - now;
  if (diff <= 0 && diff > -12 * 3600000) {
    return <p className="countdown-now">Днес е денят! 🎉</p>;
  }
  if (diff <= 0) return null;

  const s = Math.floor(diff / 1000);
  const vals = [
    Math.floor(s / 86400),
    Math.floor((s % 86400) / 3600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ];

  return (
    <div className="card countdown">
      <span className="sum-label">До срещата ни остават</span>
      <div className="countdown-grid">
        {vals.map((v, i) => (
          <div key={LABELS[i]} className="cd-cell">
            <span className="cd-num">{v}</span>
            <span className="cd-lab">{LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
