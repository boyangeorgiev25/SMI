import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../config.js";
import { savePrize } from "../storage.js";

const PRIZE_KEY = "date-last-prize";

// random prize, but never the same one twice in a row
function pickPrize() {
  const prizes = CONFIG.scratchPrizes || (CONFIG.scratchPrize ? [CONFIG.scratchPrize] : []);
  if (!prizes.length) return null;
  if (prizes.length === 1) return prizes[0];
  let last = -1;
  try { last = Number(localStorage.getItem(PRIZE_KEY)); } catch { /* fine */ }
  let i = Math.floor(Math.random() * prizes.length);
  if (i === last) i = (i + 1) % prizes.length;
  try { localStorage.setItem(PRIZE_KEY, String(i)); } catch { /* fine */ }
  return prizes[i];
}

export default function ScratchCard() {
  const [prize] = useState(pickPrize);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const scratching = useRef(false);
  const last = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    const { offsetWidth: w, offsetHeight: h } = wrapRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#ff5c8a");
    g.addColorStop(1, "#f5a83c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "700 16px -apple-system, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Изтъркай ме с пръст 🎁", w / 2, h / 2);
  }, [revealed]);

  function point(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function scratch(e) {
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    const from = last.current || p;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 38;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function checkCleared() {
    const canvas = canvasRef.current;
    const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 64) {
      total++;
      if (data[i] === 0) clear++;
    }
    if (clear / total > 0.45 && !revealed) {
      setRevealed(true);
      savePrize(prize);
    }
  }

  if (!prize) return null;

  return (
    <div className="card scratch-block">
      <p className="sub search-title">Изненада от {CONFIG.yourNick} 🎁</p>
      <div className="scratch-wrap" ref={wrapRef}>
        <div className={`scratch-prize ${revealed ? "pop" : ""}`}>{prize}</div>
        {!revealed && (
          <canvas
            ref={canvasRef}
            className="scratch-canvas"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scratching.current = true;
              last.current = null;
              scratch(e);
            }}
            onPointerMove={(e) => scratching.current && scratch(e)}
            onPointerUp={() => {
              scratching.current = false;
              last.current = null;
              checkCleared();
            }}
          />
        )}
      </div>
    </div>
  );
}
