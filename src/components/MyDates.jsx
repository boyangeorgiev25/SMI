import { useState } from "react";
import { CONFIG } from "../config.js";
import { getAll, deleteBooking } from "../storage.js";
import { formatDate } from "./Activities.jsx";
import { mapsLink, allActivities, locText } from "./Done.jsx";

export default function MyDates({ onBack }) {
  const [bookings, setBookings] = useState(() => getAll().bookings);
  const [open, setOpen] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [stage, setStage] = useState(0);
  const [gamble, setGamble] = useState(null); // null | {phase:"pick"} | {phase:"reveal", guess, card, win}

  const STAGES = [
    { emoji: "🥺", title: "Отказваш срещата?", sub: "Сигурна ли си?" },
    { emoji: "🥹", title: "Чакай… наистина ли?", sub: "Толкова я чаках…" },
    { emoji: "💨😢", title: "Помисли за наргилето…", sub: "И за коктейлите… и за мен…" },
    { emoji: "💔", title: "Последен шанс", sub: "Наистина ли ще ми разбиеш сърцето?" },
  ];

  function openCancel(b) {
    setToCancel(b);
    setStage(0);
  }

  function closeCancel() {
    setToCancel(null);
    setStage(0);
    setGamble(null);
  }

  function yesCancel() {
    if (stage < STAGES.length - 1) {
      setStage(stage + 1);
    } else {
      setGamble({ phase: "pick" });
    }
  }

  function drawCard(guess) {
    const suits = ["♥", "♦", "♠", "♣"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suit = suits[Math.floor(Math.random() * 4)];
    const rank = ranks[Math.floor(Math.random() * 13)];
    const isRed = suit === "♥" || suit === "♦";
    const win = (guess === "red") === isRed;
    setGamble({ phase: "reveal", guess, card: { suit, rank, isRed }, win });
    if (win) {
      setTimeout(() => {
        deleteBooking(toCancel.at);
        setBookings(getAll().bookings);
        closeCancel();
      }, 2600);
    }
  }

  return (
    <div className="screen">
      <h1>Нашите срещи 💘</h1>
      <p className="sub">{bookings.length === 0 ? "Още нищо запазено…" : "Всичко, което сме планирали"}</p>

      {bookings.map((b) => {
        const acts = allActivities(b);
        const loc = locText(b.location);
        const isOpen = open === b.at;
        return (
          <div key={b.at} className="card booking-row">
            <button className="booking-head" onClick={() => setOpen(isOpen ? null : b.at)}>
              <span className="bh-date">📅 {b.dates.map(formatDate).join(" · ")}</span>
              <span className="bh-hour">🕗 {b.hour}</span>
              <span className={`bh-chev ${isOpen ? "up" : ""}`}>▾</span>
            </button>
            {isOpen && (
              <div className="booking-body">
                <div className="sum-row"><span>🎯 План</span><b>{acts.map((a) => `${a.emoji} ${a.label}`).join(", ")}</b></div>
                <div className="sum-row"><span>⏱ Време</span><b>~{acts.reduce((t, a) => t + a.hours, 0)} h</b></div>
                <div className="sum-row"><span>📍 Къде</span><b>{loc}</b></div>
                <div className="booking-actions">
                  {mapsLink(b.location) && (
                    <a className="maps-link" href={mapsLink(b.location)} target="_blank" rel="noreferrer">
                      Навигирай 🗺️
                    </a>
                  )}
                  <button className="btn-small danger" onClick={() => setToCancel(b)}>Откажи ✕</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button className="btn ghost" onClick={onBack}>← Назад</button>

      {toCancel && gamble && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {gamble.phase === "pick" ? (
              <>
                <div className="modal-emoji">🎰</div>
                <h2>Последно нещо…</h2>
                <p className="sub">Трябва да <b>спечелиш</b> отказа. Познай цвета на картата — познаеш ли, отказана е; сгрешиш ли, срещата остава 😏</p>
                <div className="gamble-btns">
                  <button className="btn gamble-red" onClick={() => drawCard("red")}>🔴 Червено</button>
                  <button className="btn gamble-black" onClick={() => drawCard("black")}>⚫ Черно</button>
                </div>
                <button className="btn-link" onClick={closeCancel}>няма значение, запази срещата 💘</button>
              </>
            ) : (
              <>
                <div className={`play-card ${gamble.card.isRed ? "red" : "black"}`}>
                  <span className="pc-rank">{gamble.card.rank}</span>
                  <span className="pc-suit">{gamble.card.suit}</span>
                </div>
                {gamble.win ? (
                  <>
                    <h2>Позна… 💔</h2>
                    <p className="sub">Добре. Срещата е отказана. Дано картата си е струвала 🥀</p>
                  </>
                ) : (
                  <>
                    <h2>Загуби! 😌</h2>
                    <p className="sub">Вселената каза своето — срещата ОСТАВА 💘</p>
                    <button className="btn keep-big" onClick={closeCancel}>Добре, отиваме 💘</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {toCancel && !gamble && (
        <div className="modal-overlay" onClick={closeCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()} key={stage}>
            <div className="modal-emoji">{STAGES[stage].emoji}</div>
            <h2>{STAGES[stage].title}</h2>
            <p className="sub">{STAGES[stage].sub}</p>
            <p className="sub modal-dates">{toCancel.dates.map(formatDate).join(" · ")}</p>
            <button className="btn keep-big" onClick={closeCancel}>Не, запази я! 💘</button>
            <button className="btn-link" onClick={yesCancel}>
              {stage < STAGES.length - 1 ? "откажи я…" : "да, откажи я 💔"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
