import { useEffect } from "react";
import { CONFIG } from "../config.js";
import { getResumedFrom } from "../storage.js";

const DAY = 86400000;

// ms together: from togetherFrom to pausedFrom (the breakup moment),
// plus time since resumedFrom (config value, or the moment she pressed ▶)
export function togetherMs(now = Date.now()) {
  const start = new Date(CONFIG.togetherFrom || CONFIG.answers.startDate);
  const pause = CONFIG.pausedFrom ? new Date(CONFIG.pausedFrom) : null;
  let ms = (pause ? pause.getTime() : now) - start.getTime();
  const resumed = CONFIG.resumedFrom || getResumedFrom();
  if (pause && resumed) ms += now - new Date(resumed).getTime();
  return Math.max(ms, 0);
}

export function daysTogether() {
  return Math.floor(togetherMs() / DAY);
}

export default function Authorized({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="screen auth-screen">
      <div className="auth-rings">
        <span className="ring r1" />
        <span className="ring r2" />
        <span className="ring r3" />
        <div className="auth-heart">💖</div>
      </div>
      <h1 className="auth-title">ДОСТЪП РАЗРЕШЕН</h1>
      <p className="auth-sub">Добре дошла, {CONFIG.herName}… имаш право да запазиш среща ✨</p>
    </div>
  );
}
