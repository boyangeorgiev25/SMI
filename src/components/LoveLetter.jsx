import { useState } from "react";
import { CONFIG } from "../config.js";

export default function LoveLetter() {
  const [open, setOpen] = useState(false);
  if (!CONFIG.loveLetter) return null;

  return (
    <>
      <button type="button" className="card letter-card" onClick={() => setOpen(true)}>
        <span className="letter-emoji">💌</span>
        <span className="letter-hint">Имаш писмо от {CONFIG.yourNick}… докосни го</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal letter-modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-emoji">💌</span>
            <p className="letter-text">{CONFIG.loveLetter}</p>
            {CONFIG.songUrl && (
              <a className="mystery-play" href={CONFIG.songUrl} target="_blank" rel="noreferrer" aria-label="▶">
                ▶
              </a>
            )}
            <button className="btn" onClick={() => setOpen(false)}>Обичам те 💖</button>
          </div>
        </div>
      )}
    </>
  );
}
