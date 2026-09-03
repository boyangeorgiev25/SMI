import { useEffect } from "react";
import { formatHours } from "./Activities.jsx";

export default function PlanReveal({ acts, onDone }) {
  const total = acts.reduce((s, a) => s + a.hours, 0);
  const duration = 1200 + acts.length * 380;
  const hasHookah = acts.some(
    (a) => a.id === "hookah" || /нарг|шиша|hookah|narga|shisha/i.test(a.label || "")
  );
  const stay = duration + 1400 + (hasHookah ? 600 : 0);

  useEffect(() => {
    const t = setTimeout(onDone, stay);
    return () => clearTimeout(t);
  }, [onDone, stay]);

  return (
    <div className="screen auth-screen plan-reveal">
      <h1 className="plan-title">
        {hasHookah ? "Нямам търпение да пуша нарга с теб 💨" : "Какъв план само! 🔥"}
      </h1>

      <div className="plan-acts">
        {acts.map((a, i) => (
          <div
            key={i}
            className={`plan-act ${a.id ? "mine" : "hers"}`}
            style={{ animationDelay: `${0.5 + i * 0.38}s` }}
          >
            <span className="plan-emoji">{a.emoji}</span>
            <span className="plan-label">{a.label}</span>
          </div>
        ))}
      </div>

      <p className="plan-total" style={{ animationDelay: `${(duration + 200) / 1000}s` }}>
        ⏱ {formatHours(total)} заедно 😏
      </p>

    </div>
  );
}
