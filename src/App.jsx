import { useEffect, useState } from "react";
import Quiz from "./components/Quiz.jsx";
import Authorized from "./components/Authorized.jsx";
import CalendarPick from "./components/CalendarPick.jsx";
import Activities from "./components/Activities.jsx";
import Details from "./components/Details.jsx";
import Done from "./components/Done.jsx";
import Booked from "./components/Booked.jsx";
import PlanReveal from "./components/PlanReveal.jsx";
import DatesReveal from "./components/DatesReveal.jsx";
import { allActivities } from "./components/Done.jsx";
import Admin from "./components/Admin.jsx";
import MyDates from "./components/MyDates.jsx";
import ReasonsHeart from "./components/ReasonsHeart.jsx";
import { saveBooking, trackVisit, trackTime } from "./storage.js";

const AUTH_KEY = "date-auth";
const FLOW_KEY = "date-flow";
const VISIT_KEY = "date-visit-counted";
// refreshing mid-animation lands on the screen the animation leads to
const STABLE_STEP = { authorized: "calendar", datesreveal: "activities", planreveal: "details", booked: "done" };

function loadFlow() {
  if (!sessionStorage.getItem(AUTH_KEY)) return null;
  try {
    return JSON.parse(sessionStorage.getItem(FLOW_KEY));
  } catch {
    return null;
  }
}

export default function App() {
  const [saved] = useState(loadFlow);
  const [step, setStep] = useState(() => {
    if (!sessionStorage.getItem(AUTH_KEY)) return "quiz";
    if (saved?.step === "done" || saved?.step === "mydates") return saved.booking ? saved.step : "calendar";
    return saved?.step || "calendar";
  });
  const [dates, setDates] = useState(saved?.dates || []);
  const [activities, setActivities] = useState(saved?.activities || []);
  const [customs, setCustoms] = useState(saved?.customs || []);
  const [booking, setBooking] = useState(saved?.booking || null);

  useEffect(() => {
    const stable = STABLE_STEP[step] || step;
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ step: stable, dates, activities, customs, booking }));
  }, [step, dates, activities, customs, booking]);
  const checkAdmin = () => {
    const url = (window.location.hash + window.location.search).toLowerCase();
    return url.includes("boyan") || url.includes("admin");
  };
  const [isAdmin, setIsAdmin] = useState(checkAdmin);

  useEffect(() => {
    const onHash = () => setIsAdmin(checkAdmin());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // one visit per browser session (survives reloads in the same tab)
  useEffect(() => {
    if (isAdmin) return;
    if (!sessionStorage.getItem(VISIT_KEY)) {
      sessionStorage.setItem(VISIT_KEY, "1");
      trackVisit();
    }
  }, [isAdmin]);

  // time per screen — counted only while the tab is visible;
  // transient animation screens count toward total time only
  useEffect(() => {
    if (isAdmin) return;
    const screen = STABLE_STEP[step] ? null : step;
    let last = Date.now();
    const add = () => {
      const now = Date.now();
      trackTime(screen, Math.round((now - last) / 1000));
      last = now;
    };
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") add();
      else last = Date.now();
    }, 15000);
    const onVis = () => {
      if (document.visibilityState === "hidden") add();
      else last = Date.now();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      if (document.visibilityState === "visible") add();
    };
  }, [step, isAdmin]);

  function onQuizPass() {
    sessionStorage.setItem(AUTH_KEY, "1");
    setStep("authorized");
  }

  function bookAnother() {
    setDates([]);
    setActivities([]);
    setCustoms([]);
    setBooking(null);
    setStep("calendar"); // already authorised this session — no quiz again
  }

  if (isAdmin) return <div className="phone"><Admin /></div>;

  return (
    <div className="phone">
      {step === "quiz" && <Quiz onPass={onQuizPass} />}
      {step === "authorized" && <Authorized onDone={() => setStep("calendar")} />}
      {step === "calendar" && (
        <CalendarPick initial={dates} onDone={(d) => { setDates(d); setStep("datesreveal"); }} />
      )}
      {step === "datesreveal" && <DatesReveal dates={dates} onDone={() => setStep("activities")} />}
      {step === "activities" && (
        <Activities
          dates={dates}
          initialPicked={activities}
          initialCustoms={customs}
          onBack={() => setStep("calendar")}
          onDone={({ ids, customs: c }) => { setActivities(ids); setCustoms(c); setStep("planreveal"); }}
        />
      )}
      {step === "planreveal" && (
        <PlanReveal
          acts={allActivities({ activities, customActivities: customs })}
          onDone={() => setStep("details")}
        />
      )}
      {step === "details" && (
        <Details
          onBack={() => setStep("activities")}
          onDone={({ hour, location }) => {
            const b = { dates, activities, customActivities: customs, hour, location };
            saveBooking(b);
            setBooking(b);
            setStep("booked");
          }}
        />
      )}
      {step === "booked" && <Booked onDone={() => setStep("done")} />}
      {step === "done" && (
        <Done booking={booking} onReview={() => setStep("mydates")} onBookAnother={bookAnother} />
      )}
      {step === "mydates" && <MyDates onBack={() => setStep("done")} />}
      {["calendar", "done", "mydates"].includes(step) && <ReasonsHeart />}
    </div>
  );
}
