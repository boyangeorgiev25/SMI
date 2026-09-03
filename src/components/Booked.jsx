import { useEffect } from "react";

const COLORS = ["#ff5c8a", "#e08f22", "#ffa3c0", "#ffc46b", "#ffd166"];
const EMOJI = ["💘", "💖", "✨", "💕"];

export default function Booked({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="screen auth-screen booked-anim">
      <div className="confetti">
        {Array.from({ length: 34 }, (_, i) => (
          <span
            key={i}
            className={`confetto ${i % 5 === 0 ? "emoji" : ""}`}
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              animationDelay: `${(i % 11) * 0.14}s`,
              animationDuration: `${2.2 + (i % 5) * 0.3}s`,
              background: i % 5 === 0 ? "none" : COLORS[i % COLORS.length],
            }}
          >
            {i % 5 === 0 ? EMOJI[(i / 5) % EMOJI.length | 0] : ""}
          </span>
        ))}
      </div>

      <div className="booked-heart">💘</div>
      <h1 className="booked-stamp">ЗАПАЗЕНО!</h1>
    </div>
  );
}
