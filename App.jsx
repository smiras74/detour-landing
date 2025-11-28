import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Compass,
  Navigation,
  Smartphone,
  ChevronRight,
  Check,
  X,
  Globe,
  Sparkles,
  Loader,
  AlertTriangle,
  MapPin,
} from "lucide-react";

// ---- КАРТИНКИ ----
// ВАЖНО: эти файлы должны лежать в /public:
// public/IMG_0289.jpeg
// public/IMG_0288.jpg
// public/IMG_0275.jpg
const IMAGES = {
  logo: "/IMG_0289.jpeg",
  profile: "/IMG_0288.jpg",
  map: "/IMG_0275.jpg",
};

// ---- ТЕКСТЫ ДЛЯ ЯЗЫКОВ ----
const STRINGS = {
  fr: {
    code: "fr",
    label: "Français",
    tagline: "Le guide qui enrichit vos trajets.",
    hero_title_part1: "Ça vaut le",
    hero_title_part2: "détour !",
    hero_subtitle:
      "Choisissez un rayon de détour, et Guide du Détour se charge de remplir la route d’histoires, de paysages et de bonnes adresses.",
    menu: {
      concept: "Concept",
      features: "Fonctionnalités",
      ai: "Laboratoire IA",
      join: "Accès anticipé",
    },
    hero_cta: "Demander un accès anticipé",
    hero_secondary: "Voir un exemple d’itinéraire",
    phone: {
      interests: "Vos centres d’intérêt",
      route: "Votre route enrichie",
    },
    form_title: "Rejoindre la liste d’attente",
    form_subtitle:
      "Laissez votre email pour être prévenu·e quand la beta sera disponible.",
    email_placeholder: "votre@email.com",
    form_button: "Rejoindre la beta",
    form_success: "Merci ! Nous vous tiendrons au courant très bientôt.",
    form_error: "Une erreur s’est produite. Merci de réessayer.",
    ai_lab_title: "Laboratoire IA · Explorer un détour",
    ai_lab_subtitle:
      "Entrez une région ou une ville en France pour obtenir une idée de détour.",
    ai_tab_scout: "Éclaireur",
    ai_tab_history: "Rétroviseur",
    ai_tab_food: "Coffre vide",
    ai_placeholder: "Ex : Bretagne, Lyon, Alsace…",
    ai_button: "Lancer l’IA",
    ai_loading: "L’IA réfléchit à votre détour…",
    ai_result_title: "Résultat",
    ai_error_no_input: "Ajoutez d’abord une région ou une ville.",
    ai_error_no_key:
      "Pas de clé Gemini configurée. Ajoutez VITE_GEMINI_API_KEY в .env.",
    ai_error_generic: "Impossible d’appeler l’IA. Réessayez plus tard.",
    footer: {
      made_in: "Fait en France avec curiosité.",
      contact: "Contact",
      copyright: "Guide du Détour",
    },
  },

  en: {
    code: "en",
    label: "English",
    tagline: "The guide that enriches your journeys.",
    hero_title_part1: "It’s worth",
    hero_title_part2: "the detour.",
    hero_subtitle:
      "Choose a detour radius and let Guide du Détour fill the road with stories, landscapes and good places.",
    menu: {
      concept: "Concept",
      features: "Features",
      ai: "AI Lab",
      join: "Early access",
    },
    hero_cta: "Request early access",
    hero_secondary: "See a sample route",
    phone: {
      interests: "Your interests",
      route: "Your enriched route",
    },
    form_title: "Join the waitlist",
    form_subtitle:
      "Leave your email to be notified when the beta is ready.",
    email_placeholder: "your@email.com",
    form_button: "Join beta",
    form_success: "Thanks! We’ll keep you updated soon.",
    form_error: "Something went wrong. Please try again.",
    ai_lab_title: "AI Lab · Explore a detour",
    ai_lab_subtitle:
      "Type a region or city in France to get a detour idea.",
    ai_tab_scout: "Scout",
    ai_tab_history: "Rearview",
    ai_tab_food: "Empty trunk",
    ai_placeholder: "Ex: Brittany, Lyon, Alsace…",
    ai_button: "Ask AI",
    ai_loading: "AI is thinking about your detour…",
    ai_result_title: "Result",
    ai_error_no_input: "Please add a region or city first.",
    ai_error_no_key:
      "No Gemini API key configured. Add VITE_GEMINI_API_KEY in .env.",
    ai_error_generic: "AI call failed. Try again later.",
    footer: {
      made_in: "Made in France with curiosity.",
      contact: "Contact",
      copyright: "Guide du Détour",
    },
  },

  de: {
    code: "de",
    label: "Deutsch",
    tagline: "Der Guide, der deine Fahrten bereichert.",
    hero_title_part1: "Es lohnt sich für",
    hero_title_part2: "einen Umweg.",
    hero_subtitle:
      "Wähle einen Umweg-Radius und Guide du Détour füllt deine Route mit Geschichten, Landschaften und guten Adressen.",
    menu: {
      concept: "Konzept",
      features: "Funktionen",
      ai: "KI-Labor",
      join: "Früher Zugang",
    },
    hero_cta: "Frühzugang anfragen",
    hero_secondary: "Beispielroute ansehen",
    phone: {
      interests: "Deine Interessen",
      route: "Deine bereicherte Route",
    },
    form_title: "Warteliste beitreten",
    form_subtitle:
      "Hinterlasse deine E-Mail, um über die Beta informiert zu werden.",
    email_placeholder: "du@mail.de",
    form_button: "Zur Beta",
    form_success: "Danke! Wir melden uns bald.",
    form_error: "Es ist ein Fehler aufgetreten. Bitte erneut versuchen.",
    ai_lab_title: "KI-Labor · Einen Umweg erkunden",
    ai_lab_subtitle:
      "Gib eine Region oder Stadt in Frankreich ein, um eine Umweg-Idee zu erhalten.",
    ai_tab_scout: "Scout",
    ai_tab_history: "Rückspiegel",
    ai_tab_food: "Leerraum",
    ai_placeholder: "Z.B.: Bretagne, Lyon, Elsass…",
    ai_button: "KI fragen",
    ai_loading: "Die KI denkt über deinen Umweg nach…",
    ai_result_title: "Ergebnis",
    ai_error_no_input: "Bitte zuerst eine Region oder Stadt angeben.",
    ai_error_no_key:
      "Keine Gemini API-Key gesetzt. Füge VITE_GEMINI_API_KEY in .env hinzu.",
    ai_error_generic:
      "Aufruf der KI fehlgeschlagen. Bitte später erneut versuchen.",
    footer: {
      made_in: "In Frankreich mit Neugier gemacht.",
      contact: "Kontakt",
      copyright: "Guide du Détour",
    },
  },

  ru: {
    code: "ru",
    label: "Русский",
    tagline: "Гид, который обогащает дорогу, а не только пункт назначения.",
    hero_title_part1: "Стоит сделать",
    hero_title_part2: "крюк.",
    hero_subtitle:
      "Выбираете радиус отклонения, а Guide du Détour подбрасывает вам красивые виды, историю и вкусные остановки по пути.",
    menu: {
      concept: "Концепция",
      features: "Возможности",
      ai: "Лаборатория ИИ",
      join: "Ранний доступ",
    },
    hero_cta: "Запросить ранний доступ",
    hero_secondary: "Посмотреть пример маршрута",
    phone: {
      interests: "Ваши интересы",
      route: "Ваш обогащённый маршрут",
    },
    form_title: "Записаться в список ожидания",
    form_subtitle:
      "Оставьте почту, и мы напишем, когда beta будет готова.",
    email_placeholder: "ваша@почта.ru",
    form_button: "Присоединиться к beta",
    form_success: "Спасибо! Мы скоро с вами свяжемся.",
    form_error: "Ошибка при отправке. Попробуйте ещё раз.",
    ai_lab_title: "Лаборатория ИИ · Найти крюк",
    ai_lab_subtitle:
      "Напишите регион или город во Франции — ИИ предложит интересный крюк.",
    ai_tab_scout: "Разведчик",
    ai_tab_history: "Ретроспектива",
    ai_tab_food: "Пустой багажник",
    ai_placeholder: "Например: Бретань, Лион, Эльзас…",
    ai_button: "Спросить ИИ",
    ai_loading: "ИИ думает над вашим маршрутом…",
    ai_result_title: "Результат",
    ai_error_no_input: "Сначала напишите регион или город.",
    ai_error_no_key:
      "Не задан ключ Gemini. Добавьте VITE_GEMINI_API_KEY в .env.",
    ai_error_generic:
      "Не удалось обратиться к ИИ. Попробуйте ещё раз позже.",
    footer: {
      made_in: "Сделано во Франции с любопытством.",
      contact: "Контакт",
      copyright: "Guide du Détour",
    },
  },
};

// ---- ХУК ЯЗЫКА ----
const useLanguage = () => {
  const getInitialLang = () => {
    const stored = localStorage.getItem("lang");
    if (stored && STRINGS[stored]) return stored;

    const browserCode = navigator.language.split("-")[0].toLowerCase();
    const map = {
      fr: "fr",
      en: "en",
      de: "de",
      ru: "ru",
    };
    return map[browserCode] || "fr";
  };

  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const setLanguage = (next) => {
    if (STRINGS[next]) setLang(next);
    else console.warn("Unsupported language:", next);
  };

  const strings = STRINGS[lang] || STRINGS.fr;

  return { lang, strings, setLanguage };
};

// ---- FIREBASE ----
const firebaseConfig = {
  apiKey: "AIzaSyCWQJtzHMksDG5UgLVma8LnYiOxYYcv_AQ",
  authDomain: "guide-du-detour.firebaseapp.com",
  projectId: "guide-du-detour",
  storageBucket: "guide-du-detour.firebasestorage.app",
  messagingSenderId: "182479723840",
  appId: "1:182479723840:web:866963483cf1bca6f9aea5",
  measurementId: "G-17851JKM7F",
};

const app = initializeApp(firebaseConfig);
// analytics можно не использовать на dev, но и не мешает
try {
  getAnalytics(app);
} catch (e) {
  // в dev-окружении без https может падать — просто игнорируем
}
const auth = getAuth(app);
const db = getFirestore(app);

// ---- КОМПОНЕНТ: ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА ----
const LanguageSwitcher = ({ lang, setLanguage }) => {
  const languages = Object.values(STRINGS);

  return (
    <div className="relative">
      <select
        onChange={(e) => setLanguage(e.target.value)}
        value={lang}
        className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full border border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label} ({l.code.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
};

// ---- КОМПОНЕНТ: МОК АП ТЕЛЕФОНА ----
const PhoneMockup = ({ strings, activeScreen, setActiveScreen }) => {
  const screens = [
    {
      id: "profile",
      title: strings.phone.interests,
      src: IMAGES.profile,
      alt: "Ecran profil",
    },
    {
      id: "map",
      title: strings.phone.route,
      src: IMAGES.map,
      alt: "Ecran carte",
    },
  ];

  const current =
    screens.find((s) => s.id === activeScreen) || screens[0];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      {/* корпус телефона */}
      <div className="relative rounded-[36px] border border-slate-700 bg-slate-900/80 shadow-2xl overflow-hidden aspect-[9/19]">
        <div className="absolute inset-x-8 top-3 h-6 rounded-full bg-slate-900/90 flex items-center justify-between px-4 text-[10px] text-slate-400">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <Sparkles size={12} /> 4G
          </span>
        </div>

        <div className="absolute inset-x-4 top-10 text-xs text-slate-300 flex justify-between">
          <span>{current.title}</span>
          <span className="flex items-center gap-1">
            <MapPin size={12} /> FR
          </span>
        </div>

        <div className="absolute inset-0 mt-14 mb-6">
          <img
            src={current.src}
            alt={current.alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/320x640/020617/f9fafb?text=Image+not+found";
            }}
          />
        </div>
      </div>

      {/* кнопки-переключатели */}
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => setActiveScreen("profile")}
          className={`px-3 py-1 rounded-full text-xs border ${
            activeScreen === "profile"
              ? "bg-emerald-500 text-slate-900 border-emerald-400"
              : "bg-slate-900 text-slate-300 border-slate-700"
          }`}
        >
          <Smartphone size={14} className="inline mr-1" />
          {strings.phone.interests}
        </button>
        <button
          onClick={() => setActiveScreen("map")}
          className={`px-3 py-1 rounded-full text-xs border ${
            activeScreen === "map"
              ? "bg-emerald-500 text-slate-900 border-emerald-400"
              : "bg-slate-900 text-slate-300 border-slate-700"
          }`}
        >
          <Navigation size={14} className="inline mr-1" />
          {strings.phone.route}
        </button>
      </div>
    </div>
  );
};

// ---- КОМПОНЕНТ: AI ЛАБОРАТОРИЯ ----
const AiLab = ({ strings, lang }) => {
  const [activeTab, setActiveTab] = useState("scout");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey =
    typeof process !== "undefined"
      ? import.meta.env.VITE_GEMINI_API_KEY || ""
      : "";

  const getSystemPrompt = () => {
    if (lang === "fr") {
      if (activeTab === "scout")
        return `Tu es le mode "Éclaireur" de l'application Guide du Détour. Pour une région ou ville donnée en France, propose un seul détour original avec une explication courte (max 80 mots) en français.`;
      if (activeTab === "history")
        return `Tu es le mode "Rétroviseur". Raconte une petite histoire ou anecdote historique liée à ce lieu, en français, ton chaleureux, max 80 mots.`;
      return `Tu es le mode "Coffre vide". Pour ce lieu en France, propose 3 produits locaux intéressants à acheter et ramener, en français, sous forme de liste courte.`;
    }
    if (lang === "ru") {
      if (activeTab === "scout")
        return `Ты — режим "Разведчик" приложения Guide du Détour. Для указанного региона или города во Франции предложи один интересный крюк (место или короткий маршрут) с объяснением до 80 слов, по-русски.`;
      if (activeTab === "history")
        return `Ты — режим "Ретроспектива". Расскажи короткую историческую историю или легенду, связанную с этим местом, до 80 слов, по-русски.`;
      return `Ты — режим "Пустой багажник". Для указанного региона во Франции предложи 3 аутентичных местных продукта, которые стоит купить и привезти, списком, по-русски.`;
    }
    // en / de — общее, на английском
    if (activeTab === "scout")
      return `You are the "Scout" mode of Guide du Détour. For a region or city in France, suggest one interesting detour with a short explanation (max 80 words) in English.`;
    if (activeTab === "history")
      return `You are the "Rearview" mode. Tell a short historical story or anecdote related to this place in English, max 80 words.`;
    return `You are the "Empty Trunk" mode. For the given region in France, list 3 local products worth buying and bringing back, in English, as a short list.`;
  };

  const handleRun = async () => {
    setError("");
    setResult("");

    if (!input.trim()) {
      setError(strings.ai_error_no_input);
      return;
    }

    if (!apiKey) {
      setError(strings.ai_error_no_key);
      return;
    }

    setLoading(true);
    try {
      const systemPrompt = getSystemPrompt();

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" +
          apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: input }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      );

      const data = await res.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        JSON.stringify(data, null, 2);

      setResult(text);
    } catch (e) {
      console.error(e);
      setError(strings.ai_error_generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="ai"
      className="py-20 bg-slate-900 border-t border-slate-800"
    >
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm font-medium">
          <Sparkles size={16} />
          <span>{strings.ai_lab_title}</span>
        </div>
        <p className="text-slate-300 mb-6">
          {strings.ai_lab_subtitle}
        </p>

        <div className="grid md:grid-cols-[2fr,3fr] gap-6 items-stretch">
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
            <div className="inline-flex rounded-full bg-slate-800 p-1 text-xs mb-1">
              <button
                onClick={() => setActiveTab("scout")}
                className={`px-3 py-1 rounded-full flex-1 ${
                  activeTab === "scout"
                    ? "bg-emerald-500 text-slate-900"
                    : "text-slate-300"
                }`}
              >
                {strings.ai_tab_scout}
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1 rounded-full flex-1 ${
                  activeTab === "history"
                    ? "bg-emerald-500 text-slate-900"
                    : "text-slate-300"
                }`}
              >
                {strings.ai_tab_history}
              </button>
              <button
                onClick={() => setActiveTab("food")}
                className={`px-3 py-1 rounded-full flex-1 ${
                  activeTab === "food"
                    ? "bg-emerald-500 text-slate-900"
                    : "text-slate-300"
                }`}
              >
                {strings.ai_tab_food}
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={strings.ai_placeholder}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                <AlertTriangle size={14} className="mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleRun}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span>{strings.ai_loading}</span>
                </>
              ) : (
                <>
                  <Compass size={16} />
                  <span>{strings.ai_button}</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-sm text-slate-100 whitespace-pre-wrap">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {strings.ai_result_title}
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-slate-900 border border-slate-700 flex items-center gap-1 text-slate-300">
                <Sparkles size={12} /> Gemini
              </span>
            </div>
            {result ? (
              <div>{result}</div>
            ) : (
              <div className="text-slate-500 text-sm">
                ▸ {strings.ai_loading}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ---- ОСНОВНОЕ ПРИЛОЖЕНИЕ ----
const App = () => {
  const { lang, strings, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [user, setUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState("profile");

  // Анонимная авторизация в Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await addDoc(collection(db, "beta_waitlist"), {
        email: email.trim(),
        lang,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative max-w-6xl mx-auto">
        {/* легкий градиентный фон */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 blur-3xl opacity-70" />
        <div className="relative z-10">
          {/* ШАПКА */}
          <nav className="flex items-center justify-between px-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                <img
                  src={IMAGES.logo}
                  alt="Guide du Détour"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/80x80/020617/f9fafb?text=GDD";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>Guide du Détour</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px] text-emerald-300 border border-emerald-500/40">
                    <Sparkles size={10} />
                    beta
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {strings.tagline}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="#concept" className="hover:text-emerald-400">
                {strings.menu.concept}
              </a>
              <a href="#features" className="hover:text-emerald-400">
                {strings.menu.features}
              </a>
              <a href="#ai" className="hover:text-emerald-400">
                {strings.menu.ai}
              </a>
              <a href="#join" className="hover:text-emerald-400">
                {strings.menu.join}
              </a>
            </div>

            <LanguageSwitcher lang={lang} setLanguage={setLanguage} />
          </nav>

          {/* HERO */}
          <header className="px-6 pt-12 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-300">
                  <Globe size={14} />
                  <span>FR · EN · DE · RU</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Private beta</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                  <span>{strings.hero_title_part1} </span>
                  <span className="text-emerald-400">
                    {strings.hero_title_part2}
                  </span>
                </h1>

                <p className="text-base text-slate-300">
                  {strings.hero_subtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#join"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
                  >
                    <Compass size={16} />
                    <span>{strings.hero_cta}</span>
                    <ChevronRight size={16} />
                  </a>
                  <a
                    href="#ai"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-slate-700 text-sm text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
                  >
                    <Smartphone size={16} />
                    <span>{strings.hero_secondary}</span>
                  </a>
                </div>
              </div>

              <div className="flex justify-center">
                <PhoneMockup
                  strings={strings}
                  activeScreen={activeScreen}
                  setActiveScreen={setActiveScreen}
                />
              </div>
            </div>
          </header>

          {/* ПРОСТОЙ БЛОК "ФИЧИ" */}
          <section
            id="features"
            className="px-6 pb-16 border-t border-slate-800/60 pt-10"
          >
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-emerald-300 text-xs">
                  <Compass size={14} />
                  <span>Itinéraires enrichis</span>
                </div>
                <p className="text-slate-100">
                  Choisissez un rayon de détour, l’app place sur
                  votre route des arrêts faits pour vous.
                </p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-emerald-300 text-xs">
                  <MapPin size={14} />
                  <span>Filtres par envies</span>
                </div>
                <p className="text-slate-100">
                  Histoire, nature, gastronomie : choisissez vos
                  envies, on s’occupe du reste.
                </p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-emerald-300 text-xs">
                  <Sparkles size={14} />
                  <span>Laboratoire IA</span>
                </div>
                <p className="text-slate-100">
                  Une IA entraînée pour imaginer des détours
                  réalistes à partir d’une simple zone en France.
                </p>
              </div>
            </div>
          </section>

          {/* AI LAB */}
          <AiLab strings={strings} lang={lang} />

          {/* ФОРМА EMAIL */}
          <section
            id="join"
            className="px-6 py-16 border-t border-slate-800"
          >
            <div className="max-w-xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-semibold">
                {strings.form_title}
              </h2>
              <p className="text-slate-300 text-sm">
                {strings.form_subtitle}
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-4 flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={strings.email_placeholder}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader
                        size={16}
                        className="animate-spin"
                      />
                      <span>…</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{strings.form_button}</span>
                    </>
                  )}
                </button>
              </form>

              {status === "success" && (
                <p className="mt-3 text-sm text-emerald-300 flex items-center justify-center gap-2">
                  <Check size={16} /> {strings.form_success}
                </p>
              )}
              {status === "error" && (
                <p className="mt-3 text-sm text-red-400 flex items-center justify-center gap-2">
                  <X size={16} /> {strings.form_error}
                </p>
              )}
            </div>
          </section>

          {/* ФУТЕР */}
          <footer className="px-6 py-8 border-t border-slate-900 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span>{strings.footer.made_in}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>© 2025 {strings.footer.copyright}</span>
              <a
                href="mailto:hello@guidedudetour.com"
                className="hover:text-emerald-300"
              >
                {strings.footer.contact}
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
