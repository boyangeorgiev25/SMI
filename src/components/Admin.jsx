import { useEffect, useState } from "react";
import { getAll, clearAll, getResumedFrom, clearResumedFrom, syncFromServer, getSyncStatus } from "../storage.js";
import { CONFIG } from "../config.js";
import { formatDate } from "./Activities.jsx";
import { mapsLink, allActivities, locText } from "./Done.jsx";

const SCREEN_LABELS = {
  quiz: "🔐 Въпросите",
  authorized: "✨ Достъп разрешен",
  calendar: "📆 Календар",
  datesreveal: "💘 Анимация — дата",
  activities: "🎯 Активности",
  planreveal: "⏱ Анимация — план",
  details: "📍 Час и място",
  booked: "🎉 Анимация — запазено",
  done: "💌 Финален екран",
  mydates: "📋 Нашите срещи",
};

function fmtDur(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
  if (h) return `${h}ч ${m}м`;
  if (m) return `${m}м ${sec}с`;
  return `${sec}с`;
}

// transient animation screens — not listed in "where she stays"
const ANIM_SCREENS = new Set(["authorized", "datesreveal", "planreveal", "booked"]);

export default function Admin() {
  const [data, setData] = useState(getAll());
  const [resumedAt, setResumedAt] = useState(getResumedFrom());
  const [tab, setTab] = useState("stats");
  const [sync, setSync] = useState(getSyncStatus());

  function refresh() {
    setData(getAll());
    setResumedAt(getResumedFrom());
    setSync(getSyncStatus());
  }

  // always show the server's copy, not this tab's possibly stale one
  useEffect(() => {
    syncFromServer().then(refresh);
  }, []);

  const prizes = data.prizes || [];
  const stats = data.stats || { visits: 0, totalSeconds: 0, screens: {} };
  const screensSorted = Object.entries(stats.screens || {})
    .filter(([k]) => !ANIM_SCREENS.has(k))
    .sort((a, b) => b[1] - a[1]);
  const maxScreen = screensSorted[0]?.[1] || 1;

  const TABS = [
    { id: "stats", label: "📊 Статистика" },
    { id: "bookings", label: `💘 Срещи (${data.bookings.length})` },
    { id: "prizes", label: `🎁 Изненади (${prizes.length})` },
    { id: "attempts", label: `🔐 Въпроси (${data.attempts.length})` },
    { id: "settings", label: "⚙️ Още" },
  ];

  function openTab(id) {
    setTab(id);
    syncFromServer().then(refresh); // fresh bookings/prizes/counter state
  }

  return (
    <div className="screen admin">
      <h1>🕵️ Админ — само за {CONFIG.yourName}</h1>

      {sync.ok === false && (
        <div className="card summary-card sync-warn">
          <b>⚠️ Няма връзка с общото хранилище</b>
          <p className="sub">
            {sync.isRemote
              ? "VITE_DATA_URL не отговаря — провери адреса и правилата на базата."
              : "Данните остават на нейния телефон и не стигат до теб. Във Vercel: проектът → Storage → Create Database → Upstash Redis → Connect, после Redeploy."}
          </p>
        </div>
      )}

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => openTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && (
        <>
          <div className="card summary-card">
            <div className="sum-row"><span>👀 Посещения</span><b>{stats.visits}</b></div>
            <div className="sum-row"><span>⏱ Общо време в сайта</span><b>{fmtDur(stats.totalSeconds || 0)}</b></div>
            <div className="sum-row"><span>❤️ Отваряния на брояча</span><b>{stats.heartOpens || 0}</b></div>
            {stats.lastVisit && (
              <div className="sum-row"><span>🕐 Последно посещение</span><b>{new Date(stats.lastVisit).toLocaleString("bg-BG")}</b></div>
            )}
          </div>
          {screensSorted.length > 0 ? (
            <div className="card summary-card">
              <div className="sum-row"><span>Къде стои най-много</span></div>
              {screensSorted.map(([k, s]) => (
                <div key={k} className="stat-screen">
                  <div className="stat-screen-top">
                    <span>{SCREEN_LABELS[k] || k}</span>
                    <b>{fmtDur(s)}</b>
                  </div>
                  <div className="stat-bar"><span style={{ width: `${(s / maxScreen) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sub">Още няма измерено време.</p>
          )}
        </>
      )}

      {tab === "bookings" && (
        <>
          {data.bookings.length === 0 && <p className="sub">Още няма резервации.</p>}
          {data.bookings.map((b, i) => {
            const acts = allActivities(b);
            return (
              <div key={i} className="card summary-card">
                <div className="sum-row"><span>📅 Ден</span><b>{b.dates.map(formatDate).join(" · ")}</b></div>
                <div className="sum-row"><span>🎯 План</span><b>{acts.map((a) => a.label).join(", ")}</b></div>
                <div className="sum-row"><span>🕗 Час</span><b>{b.hour}</b></div>
                <div className="sum-row"><span>📍 Къде</span><b>{locText(b.location)}</b></div>
                {mapsLink(b.location) && (
                  <a className="maps-link" href={mapsLink(b.location)} target="_blank" rel="noreferrer">
                    Отвори в Google Maps 🗺️
                  </a>
                )}
                <div className="sum-row"><span>💾 Запазено</span><b>{new Date(b.at).toLocaleString()}</b></div>
              </div>
            );
          })}
        </>
      )}

      {tab === "prizes" && (
        <>
          {prizes.length === 0 && <p className="sub">Още не е изтъркала нито една.</p>}
          {prizes.map((p, i) => (
            <div key={i} className="attempt ok">
              <span>🎁</span>
              <div>
                <div className="att-q">{p.prize}</div>
                <div className="att-a">{new Date(p.at).toLocaleString("bg-BG")}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "attempts" && (
        <>
          {data.attempts.length === 0 && <p className="sub">Още не е отговаряла.</p>}
          {data.attempts.map((a, i) => (
            <div key={i} className={`attempt ${a.correct ? "ok" : "bad"}`}>
              <span>{a.correct ? "✅" : "❌"}</span>
              <div>
                <div className="att-q">{a.question}</div>
                <div className="att-a">"{a.answer}" · {new Date(a.at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "settings" && (
        <>
          <h2 className="admin-h">Брояч "дни заедно"</h2>
          <div className="card summary-card">
            {CONFIG.resumedFrom ? (
              <p className="sub">▶ Пуснат от config ({CONFIG.resumedFrom}) — смени resumedFrom в config.js.</p>
            ) : resumedAt ? (
              <>
                <p className="sub">▶ Пуснат от бутона на {new Date(resumedAt).toLocaleString("bg-BG")}.</p>
                <button
                  className="btn ghost"
                  onClick={async () => { await clearResumedFrom(); setResumedAt(""); }}
                >
                  ⏸ Спри брояча (пак на пауза)
                </button>
              </>
            ) : (
              <p className="sub">⏸ На пауза от {CONFIG.pausedFrom}.</p>
            )}
          </div>

          <h2 className="admin-h">Опасна зона</h2>
          <button
            className="btn danger"
            onClick={async () => {
              if (confirm("Да изтрия ли всички данни?")) {
                await clearAll();
                refresh();
              }
            }}
          >
            Изтрий всички данни
          </button>
        </>
      )}
    </div>
  );
}
