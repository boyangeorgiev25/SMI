// ============================================================
//  EDIT THIS FILE — put the real answers here before sending
//  her the link. Answers are checked case-insensitively.
// ============================================================
export const CONFIG = {
  herName: "Миме",   // used in greetings ("really you, Миме")
  herNick: "Мими",   // used for possessives ("Мими's picks")
  yourName: "Боян",
  yourNick: "Боби",  // used for the suggestions box title

  answers: {
    // Question 1: "What's our song?" — any of these counts as correct
    song: ["7 dni", "7 дни", "sedem dni", "седем дни", "7dni"],
    // Question 2: "When did we start dating?" — format YYYY-MM-DD
    startDate: "2022-10-29",
    // Question 3: "The thing we both like really much?" — any of these counts
    sharedThing: ["shisha", "нарга", "наргиле", "hookah", "smoking", "пушим", "narga", "nargile", "шиша", "pushim", "смокинг", "sex", "секс", "seks"],
  },

  // Quiz questions — multiple choice, game-show style. EDIT ME:
  // `correct` holds the index(es) of the right option(s), counting from 0.
  quiz: [
    {
      emoji: "🎵",
      text: "Коя е нашата песен?",
      options: ["Дим да ме няма", "7 дни", "Water", "Скъпа, извинявай"],
      correct: [1],
    },
    {
      emoji: "📅",
      text: "Кога станахме гаджета?",
      options: ["14.02.2023", "29.11.2022", "29.10.2022", "15.09.2022"],
      correct: [2],
    },
    {
      emoji: "💞",
      text: "Нещото, което и двамата много обичаме?",
      options: ["Ранно ставане ⏰", "Наргиле 💨", "Салата 🥗", "Секс 😏"],
      correct: [1, 3],
    },
  ],

  // Optional: your WhatsApp number with country code, digits only,
  // e.g. "359888123456". If set, the final screen gets a
  // "Send to Boyan" button so the booking lands on your phone.
  whatsappNumber: "32492934892",

  // Optional: Google Maps JS API key — set VITE_GOOGLE_MAPS_API_KEY in .env
  // (needs Google Cloud billing). Empty → the free OpenStreetMap map is used.
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",

  // "Time together" counter: counts from togetherFrom, freezes at
  // pausedFrom (the breakup, exact moment). Set resumedFrom when you're
  // back together and the counter starts ticking again from there —
  // she can also press the ▶ button in the heart widget herself.
  togetherFrom: "2022-10-29T12:30",
  pausedFrom: "2025-02-16T00:50",
  resumedFrom: "",

  // Link opened by the "нашата песен" buttons
  songUrl: "https://www.youtube.com/results?search_query=" + encodeURIComponent("7 дни"),

  // Letter shown behind the 💌 envelope on the final screen — EDIT ME
  loveLetter:
    "Мими,\n\n" +
    "Знам, че мина време. И знам, че този сайт е малко прекалено — но " +
    "по-добре прекалено, отколкото да не опитам.\n\n" +
    "Липсваш ми. Наргилетата не са същите без теб.\n\n" +
    "Боби ❤️",

  // Reasons behind the floating ❤️ button — EDIT ME
  reasons: [
    "Усмивката ти оправя и най-скапания ми ден.",
    "Начинът, по който се смееш на собствените си шеги.",
    "С теб дори скучните неща са приключение.",
    "Никой не пуши нарга като теб.",
    "Как изглеждаш, когато се концентрираш върху нещо.",
    "Че ме познаваш по-добре от всички.",
    "Просто защото си ти.",
  ],

  // Prizes under the scratch card on the activities screen — EDIT ME
  // A random one is shown each time (never the same twice in a row).
  scratchPrizes: [
    "🎟 Ваучер: едно желание от Боби — без въпроси, без пазарлък 😏",
    "🍨 Десерт по избор — Боби черпи 😋",
    "💆 30 минути масаж от Боби — без мрънкане 😌",
    "🎬 Ти избираш филма — Боби мълчи и гледа 🍿",
    "💨 Наргиле с твоя любим вкус — Боби урежда всичко",
    "🚗 Боби те взима и те кара където кажеш — цял ден шофьор 😎",
  ],

  // Only days inside this window can be booked (inclusive, YYYY-MM-DD)
  availableFrom: "2026-09-15",
  availableTo: "2026-09-25",

  activities: [
    { id: "billiard", label: "Билярд", emoji: "🎱", hours: 1 },
    { id: "hookah",   label: "Наргиле", emoji: "💨", hours: 2 },
    { id: "pizzalab", label: "PizzaLab", emoji: "🍕", hours: 1.5 },
  ],
};

export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesAny(input, variants) {
  const n = normalize(input);
  if (!n) return false;
  return variants.some((v) => {
    const nv = normalize(v);
    return n === nv || n.includes(nv);
  });
}
