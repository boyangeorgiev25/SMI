import { useEffect } from "react";

const MONTHS = ["Януари", "Февруари", "Март", "Април", "Май", "Юни",
  "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];

export default function DatesReveal({ dates, onDone }) {
  const duration = 1100 + dates.length * 380;

  useEffect(() => {
    const t = setTimeout(onDone, duration + 1300);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="screen auth-screen plan-reveal dates-reveal">
      <h1 className="plan-title">Явно ще се видим на…</h1>

      <div className="plan-acts">
        {dates.map((d, i) => {
          const [, m, day] = d.split("-").map(Number);
          return (
            <div key={d} className="plan-act date-card" style={{ animationDelay: `${0.5 + i * 0.38}s` }}>
              <span className="date-card-day">{day}</span>
              <span className="date-card-month">{MONTHS[m - 1]}</span>
            </div>
          );
        })}
      </div>

      <p className="plan-total" style={{ animationDelay: `${(duration + 150) / 1000}s` }}>
        Сега забавната част… 😏
      </p>
    </div>
  );
}
