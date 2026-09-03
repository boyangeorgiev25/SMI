import { useCallback, useState } from "react";
import MapPicker from "./MapPicker.jsx";

export default function Details({ onDone, onBack }) {
  const [hour, setHour] = useState("18:00");
  const [loc, setLoc] = useState({ address: "" });

  const onChange = useCallback((l) => setLoc(l), []);

  function submit(e) {
    e.preventDefault();
    onDone({ hour, location: loc });
  }

  return (
    <div className="screen">
      <button type="button" className="back-btn" onClick={onBack}>← Назад към активностите</button>
      <h1>Последни детайли</h1>
      <p className="sub">Почти готово…</p>

      <form onSubmit={submit} className="details-form">
        <div className={`card detail-section ${hour ? "compact" : ""}`}>
          <span className="sum-label">Кога се виждаме?</span>
          <div className={`input-wrap ${hour ? "time-small" : ""}`}>
            <input
              type="time"
              className={`input ${hour ? "" : "quiz-input"}`}
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              required
            />
            {!hour && <span className="input-ph">Докосни и избери час 🕗</span>}
          </div>
        </div>

        {hour && (
          <div className="card detail-section reveal">
            <span className="sum-label">Къде се виждаме?</span>
            <MapPicker onChange={onChange} />
          </div>
        )}

        {hour && (
          <button type="submit" className="btn btn-big" disabled={!loc.address.trim()}>
            {!loc.address.trim() ? "Избери място на срещата…" : "Запази срещата 💘"}
          </button>
        )}
      </form>
    </div>
  );
}
