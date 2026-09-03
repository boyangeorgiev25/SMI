import { useEffect, useState } from "react";
import { CONFIG } from "../config.js";
import { logAttempt } from "../storage.js";

const WRONG_MSGS = [
  "Хмм… не е това 🤨 Опитай пак!",
  "Не позна 😅 Знам, че го знаеш…",
  "Пак грешно?! Ти коя си всъщност? 😳 Още един опит…",
  "Добре, добре… помисли по-сериозно 💭",
];

const TERM_LINES = [
  { t: "> initializing security system v2022.10.29…", warn: false },
  { t: "> loading protocol: TOP SECRET", warn: false },
  { t: "> scanning visitor…", warn: false },
  { t: "> STOP — ACCESS RESTRICTED", warn: true },
  { t: "> this page is classified", warn: false },
  { t: "> authorized personnel: 1 person in the world", warn: false },
  { t: "> everyone else: get out", warn: false },
  { t: "> identification required", warn: true },
];
const LINE_PAUSE = 18; // ticks of silence after each finished line
const TERM_TOTAL = TERM_LINES.reduce((s, l) => s + l.t.length + LINE_PAUSE, 0) - LINE_PAUSE;

export default function Quiz({ onPass }) {
  const [intro, setIntro] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const termActive = intro && !leaving;

  // terminal typing, one character per tick
  useEffect(() => {
    if (!intro) return;
    const iv = setInterval(() => {
      setTypedChars((n) => {
        if (n + 1 >= TERM_TOTAL) clearInterval(iv);
        return n + 1;
      });
    }, 16);
    return () => clearInterval(iv);
  }, [intro]);

  // the whole page (safe areas included) goes black while the terminal shows;
  // dropping the class on leave lets the pink crossfade back in underneath
  useEffect(() => {
    if (!termActive) return;
    document.documentElement.classList.add("terminal-mode");
    document.body.classList.add("terminal-mode");
    const theme = document.querySelector('meta[name="theme-color"]');
    const prevTheme = theme?.getAttribute("content");
    theme?.setAttribute("content", "#000000");
    return () => {
      document.documentElement.classList.remove("terminal-mode");
      document.body.classList.remove("terminal-mode");
      if (theme && prevTheme) theme.setAttribute("content", prevTheme);
    };
  }, [termActive]);

  function startQuiz() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => setIntro(false), 900);
  }
  const [step, setStep] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle → suspense → reveal
  const [wasOk, setWasOk] = useState(false);
  const [found, setFound] = useState([]); // correct options already picked on this question
  const questions = CONFIG.quiz;
  const q = questions[step];
  // a question with several correct options needs ALL of them, one by one
  const allFound = wasOk && q.correct.every((c) => [...found, picked].includes(c));

  function choose(i) {
    if (phase !== "idle" || found.includes(i)) return;
    const ok = q.correct.includes(i);
    setPicked(i);
    setWasOk(ok);
    setPhase("suspense");
    logAttempt(q.text, q.options[i], ok);
    setTimeout(() => {
      setPhase("reveal");
      if (ok) {
        const newFound = [...found, i];
        const done = q.correct.every((c) => newFound.includes(c));
        setTimeout(() => {
          if (!done) {
            // true — but there is one more… same question, keep looking 😏
            setFound(newFound);
            setPicked(null);
            setPhase("idle");
          } else if (step + 1 === questions.length) {
            onPass();
          } else {
            setStep(step + 1);
            setFound([]);
            setPicked(null);
            setPhase("idle");
            setWrongCount(0);
          }
        }, done ? 1100 : 1700);
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setWrongCount((c) => c + 1);
          setPicked(null);
          setPhase("idle");
        }, 900);
      }
    }, 1400);
  }

  if (intro) {
    const done = typedChars >= TERM_TOTAL;
    let remaining = typedChars;
    const lines = TERM_LINES.map(({ t, warn }) => {
      const shown = Math.max(0, Math.min(remaining, t.length));
      remaining -= t.length + LINE_PAUSE;
      return { text: t.slice(0, shown), warn, started: shown > 0 };
    });
    const started = lines.filter((l) => l.started);
    const cursorAt = started.length - 1; // cursor rides the line being typed

    return (
      <div className={`screen quiz-intro ${leaving ? "leaving" : ""}`}>
        <div className="term-body">
          {started.map((l, i) => (
            <p key={i} className={`t-line ${l.warn ? "t-warn" : ""}`}>
              {l.text}
              {i === cursorAt && <span className="t-cursor">█</span>}
            </p>
          ))}
        </div>
        {done && (
          <button className="btn qi-btn" onClick={startQuiz}>START IDENTIFICATION →</button>
        )}
      </div>
    );
  }

  function optClass(i) {
    if (found.includes(i)) return "reveal-ok"; // stays lit — already guessed
    if (picked === i) {
      if (phase === "suspense") return "suspense";
      if (phase === "reveal") return wasOk ? "reveal-ok" : "reveal-bad";
    }
    return phase !== "idle" ? "dim" : "";
  }

  return (
    <div className="screen quiz-screen">
      <div className="quiz-top">
        <div>
          <h1>Чакай малко! 🔐</h1>
          <p className="sub">Докажи, че наистина си ти, {CONFIG.herName} 😏</p>
        </div>
        <span className="quiz-step">{step + 1}<em>/{questions.length}</em></span>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${(step / questions.length) * 100 || 4}%` }} />
      </div>

      <div key={step} className={`card quiz-card2 ${shake ? "shake" : ""} ${phase === "reveal" && wasOk ? "correct" : ""}`}>
        {phase === "reveal" && wasOk && (
          <div className="correct-pop">
            {allFound ? "✅ Вярно!" : (
              <span className="one-more">
                ✅ Вярно!
                <em>…но има още едно 😏</em>
              </span>
            )}
          </div>
        )}
        <h2 className="q-text">
          <span className="q-emoji">{q.emoji}</span> {q.text}
        </h2>
        <div className="qz-opts">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={`qz-opt ${optClass(i)}`}
              style={{ animationDelay: `${0.35 + i * 0.15}s` }}
              onClick={() => choose(i)}
            >
              <span className="qz-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        {wrongCount > 0 && phase === "idle" && (
          <p className="wrong-msg">{WRONG_MSGS[Math.min(wrongCount - 1, WRONG_MSGS.length - 1)]}</p>
        )}
      </div>

      <div className="quiz-spacer" />
    </div>
  );
}
