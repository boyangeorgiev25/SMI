import { useRef, useState } from "react";
import { CONFIG } from "../config.js";
import ScratchCard from "./ScratchCard.jsx";

export function formatDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("bg-BG", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function formatHours(h) {
  const whole = Math.floor(h);
  const half = h % 1 !== 0;
  if (whole === 0) return "30 мин";
  return `${whole}${half ? ".5" : ""} ч`;
}

// activity catalog — searchable in English and Bulgarian
const CATALOG = [
  ["Кино 🎬", "cinema movie"], ["Караоке 🎤", "karaoke"], ["Ескейп стая 🗝️", "escape room"],
  ["Мини голф ⛳", "mini golf"], ["Кънки на лед ⛸️", "ice skating"], ["Ролери 🛼", "roller skating"],
  ["Игрална зала 🕹️", "arcade games"], ["Спа и масаж 💆", "spa massage"], ["Пикник 🧺", "picnic"],
  ["Музей 🖼️", "museum"], ["Галерия 🎨", "art gallery"], ["Жива музика 🎸", "live music concert"],
  ["Дегустация на вино 🍷", "wine tasting"], ["Дегустация на бира 🍺", "beer tasting"], ["Настолни игри 🎲", "board games"],
  ["Лазер таг 🔫", "laser tag"], ["Пейнтбол 🎯", "paintball"], ["Картинг 🏎️", "go karts karting"],
  ["Аквапарк 🌊", "aquapark waterpark"], ["Плуване 🏊", "swimming pool"], ["Поход на Витоша 🥾", "hiking vitosha"],
  ["Лифт с кабинка 🚡", "cable car"], ["Зоопарк 🦁", "zoo"], ["Аквариум 🐠", "aquarium"],
  ["Театър 🎭", "theatre theater"], ["Опера 🎼", "opera"], ["Стендъп комедия 😂", "stand-up comedy"],
  ["Танци 💃", "dancing club"], ["Салса урок 🕺", "salsa class"], ["Готвене заедно 👨‍🍳", "cooking together"],
  ["Готварски курс 🍳", "cooking class"], ["Суши вечер 🍣", "sushi"], ["Пица вечер 🍕", "pizza"],
  ["Брънч 🥞", "brunch breakfast"], ["Сладолед 🍦", "ice cream"], ["Десерт и торта 🍰", "dessert cake"],
  ["Кафе среща ☕", "coffee"], ["Чаена къща 🍵", "tea house"], ["Руфтоп бар 🌇", "rooftop bar"],
  ["Уайн бар 🍇", "wine bar"], ["Пъб куиз 🧠", "pub quiz"], ["Дартс 🎯", "darts"],
  ["Тенис на маса 🏓", "table tennis ping pong"], ["Тенис 🎾", "tennis"], ["Бадминтон 🏸", "badminton"],
  ["Катерачна стена 🧗", "climbing wall"], ["Батут парк 🤸", "trampoline park"], ["VR игри 🥽", "vr virtual reality"],
  ["Гейминг заедно 🎮", "gaming playstation"], ["Шопинг 🛍️", "shopping mall"], ["Разходка в парка 🌳", "park walk"],
  ["Гледане на залеза 🌅", "sunset"], ["Гледане на звезди ✨", "stargazing stars"], ["Планетариум 🔭", "planetarium"],
  ["Фотосесия 📸", "photo walk"], ["Колело 🚴", "bike ride"], ["Тротинетка 🛴", "scooter"],
  ["Езда 🐴", "horse riding"], ["Грънчарство 🏺", "pottery ceramics"], ["Рисуване заедно 🖌️", "painting"],
  ["Филм вкъщи 🛋️", "movie night home"], ["Маратон сериали 📺", "series marathon"], ["Роуд трип 🚗", "road trip"],
  ["Екскурзия до Пловдив 🏛️", "plovdiv trip"], ["Седемте рилски езера 🏔️", "rila lakes"], ["Боулинг 🎳", "bowling"],
  ["Риболов 🎣", "fishing"], ["Сауна 🧖", "sauna"], ["Концерт 🎫", "concert"],
  ["Футболен мач ⚽", "football match"], ["Баскетбол 🏀", "basketball"],
];

function searchCatalog(q) {
  const n = q.toLowerCase().trim();
  return CATALOG
    .filter(([label, bg]) => label.toLowerCase().includes(n) || bg.includes(n))
    .map(([label]) => label);
}

const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4];

export default function Activities({ dates, onDone, onBack, initialPicked = [], initialCustoms = [] }) {
  const [picked, setPicked] = useState(initialPicked);
  const [customs, setCustoms] = useState(() =>
    initialCustoms.map((c, i) => ({ id: `custom-${i}`, on: true, ...c }))
  ); // {id, label, hours, on}
  const [query, setQuery] = useState("");
  const [sugs, setSugs] = useState([]);
  const [pending, setPending] = useState(null); // label awaiting a time estimate
  const [estimate, setEstimate] = useState(null);
  const debounce = useRef(null);
  const nextId = useRef(initialCustoms.length);

  const mainActs = CONFIG.activities.filter((a) => picked.includes(a.id));
  const total =
    mainActs.reduce((s, a) => s + a.hours, 0) +
    customs.filter((c) => c.on).reduce((s, c) => s + c.hours, 0);
  const count = mainActs.length + customs.filter((c) => c.on).length;

  function toggle(id) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function onSearch(e) {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounce.current);
    if (v.trim().length < 1) { setSugs([]); return; }
    debounce.current = setTimeout(() => {
      const list = searchCatalog(v);
      // let her add whatever she types even if we don't have it
      if (list.length === 0) list.push(v.trim());
      setSugs(list.slice(0, 6));
    }, 250);
  }

  function pick(label) {
    setSugs([]);
    setQuery("");
    setPending(label);
    setEstimate(null);
  }

  function splitEmoji(raw) {
    const m = raw.match(/^(.*?)\s*(\p{Extended_Pictographic}[\u200d\uFE0F\p{Extended_Pictographic}]*)\s*$/u);
    if (m && m[1].trim()) return { label: m[1].trim(), emoji: m[2] };
    return { label: raw, emoji: "✨" };
  }

  function confirmCustom() {
    const { label, emoji } = splitEmoji(pending);
    setCustoms((c) => [...c, { id: `custom-${nextId.current++}`, label, emoji, hours: estimate, on: true }]);
    setPending(null);
  }

  function toggleCustom(id) {
    setCustoms((c) => c.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  }

  function removeCustom(id) {
    setCustoms((c) => c.filter((x) => x.id !== id));
  }

  function done() {
    onDone({ ids: picked, customs: customs.filter((c) => c.on).map(({ label, hours, emoji }) => ({ label, hours, emoji })) });
  }

  return (
    <div className="screen has-footer act-screen">
      <button type="button" className="back-btn" onClick={onBack}>← Назад към календара</button>

      <div className="dates-header">
        <span className="dates-header-label">Ден на излизане</span>
        <span className="dates-header-text">
          {dates.map(formatDate).join("  ·  ").split("").map((ch, i) => (
            <span key={i} className="blink-ch" style={{ animationDelay: `${-i * 0.13}s` }}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>
      </div>

      <h1>Какво ще правим?</h1>

      <div className="search-block">
        <p className="sub search-title">Дай ми твоите предложения</p>
        <div className="suggest-wrap">
          <input
            type="text"
            className="input"
            placeholder="Напиши идеята си…"
            value={query}
            onChange={onSearch}
            autoComplete="off"
          />
          {sugs.length > 0 && (
            <div className="suggest-list">
              {sugs.map((s, i) => (
                <button type="button" key={i} className="suggest-item" onClick={() => pick(s)}>
                  ✨ {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="suggestions-box">
        <p className="sub search-title glow-title">Предложенията на {CONFIG.yourNick}</p>
        <div className="activity-list">
          {CONFIG.activities.map((a, i) => {
            const sel = picked.includes(a.id);
            return (
              <button
                key={a.id}
                className={`activity glow-card ${sel ? "sel" : ""}`}
                style={{ animationDelay: `${i * 0.4}s` }}
                onClick={() => toggle(a.id)}
              >
                <span className="a-emoji">{a.emoji}</span>
                <span className="a-label">{a.label}</span>
                <span className="a-time">~{formatHours(a.hours)}</span>
                <span className="a-check">{sel ? "✓" : "+"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="suggestions-box hers-box">
        <p className="sub search-title glow-title hers-title">Изборът на {CONFIG.herNick}</p>
        {customs.length === 0 ? (
          <p className="hers-empty">Още нищо… напиши идея горе 😘</p>
        ) : (
          <div className="activity-list">
            {customs.map((c) => (
              <div key={c.id} className={`activity custom ${c.on ? "sel" : ""}`} onClick={() => toggleCustom(c.id)}>
                <button
                  className="a-remove"
                  onClick={(e) => { e.stopPropagation(); removeCustom(c.id); }}
                >✕</button>
                <span className="a-emoji">{c.emoji}</span>
                <span className="a-label">{c.label}</span>
                <span className="a-time">~{formatHours(c.hours)}</span>
                <span className="a-check">{c.on ? "✓" : "+"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <div className="modal-overlay" onClick={() => setPending(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">⏱</div>
            <h2>Колко време ще отнеме?</h2>
            <p className="sub">{pending}</p>
            <div className="duration-grid">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  className={`dur-chip ${estimate === d ? "sel" : ""}`}
                  onClick={() => setEstimate(d)}
                >
                  {formatHours(d)}
                </button>
              ))}
            </div>
            <button className="btn" disabled={!estimate} onClick={confirmCustom}>Добави ✨</button>
            <button className="btn-link" onClick={() => setPending(null)}>няма нужда</button>
          </div>
        </div>
      )}

      <ScratchCard />

      <div className="footer-bar">
        <div className="estimate">
          <span className="est-label">Очаквано време на срещата</span>
          <span className="est-value">{total > 0 ? `⏱ ${formatHours(total)}` : "—"}</span>
        </div>
        <button className="btn" disabled={count === 0} onClick={done}>
          Продължи →
        </button>
      </div>
    </div>
  );
}
