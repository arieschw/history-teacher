"use client";

import { useState, useEffect, useRef } from "react";

const LOADING_STEPS = [
  { emoji: "🔍", text: "מחפש במאגרי מידע היסטוריים..." },
  { emoji: "📚", text: "בודק עובדות ומקורות..." },
  { emoji: "🗺️", text: "ממפה את הרקע הגיאופוליטי..." },
  { emoji: "💰", text: "מנתח את הכוחות הכלכליים..." },
  { emoji: "⚔️", text: "מזהה מקורות מתח וסכסוך..." },
  { emoji: "🧩", text: "מרכיב את התמונה הגדולה..." },
  { emoji: "✍️", text: "כותב את הכתבה..." },
  { emoji: "🖼️", text: "מחפש תמונות מהתקופה..." },
  { emoji: "📰", text: "עורך בשבילך כתבה הכי מדויקת ותמציתית שאני יכול..." },
];

interface Section {
  heading: string;
  content: string;
}
interface TimelineEvent {
  year: string;
  description: string;
}
interface WikiImage {
  url: string;
  caption: string;
}
interface Source {
  title: string;
  author: string;
  description: string;
}
interface Article {
  title: string;
  subtitle: string;
  intro: string;
  sections: Section[];
  connections: string[];
  timeline: TimelineEvent[];
}
interface SidePanelArticle {
  title: string;
  intro: string;
  sections: Section[];
  connections: string[];
}
interface HistoryEntry {
  topic: string;
  article: Article;
  images: WikiImage[];
}
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
interface TodayEvent {
  name: string;
  year: string;
  summary: string;
}

// Renders **bold** as clickable links, \n\n as paragraphs
function FormattedText({
  text,
  onLinkClick,
  small = false,
}: {
  text: string;
  onLinkClick?: (term: string, surroundingText: string) => void;
  small?: boolean;
}) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, pi) => {
        // Strip ** markers to get clean surrounding text for context
        const cleanPara = para.replace(/\*\*/g, "");
        const parts = para.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={pi} className={small ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}>
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <button
                  key={i}
                  onClick={() => onLinkClick?.(part, cleanPara)}
                  className="font-black text-amber-700 hover:text-amber-900 underline decoration-dotted cursor-pointer"
                  title={`פתח הסבר על: ${part}`}
                >
                  {part}
                </button>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

const SUGGESTED_TOPICS = [
  "נפילת האימפריה העות'מאנית",
  "המהפכה הצרפתית",
  "עליית הנאציזם",
  "מלחמת העולם הראשונה",
  "הצהרת בלפור",
  "המהפכה התעשייתית",
  "הקולוניאליזם האירופי באפריקה",
  "מלחמת העצמאות של ישראל",
  "המהפכה הרוסית",
  "הרנסנס האיטלקי",
];

export default function Home() {
  const [topic, setTopic] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [images, setImages] = useState<WikiImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState("");
  const [error, setError] = useState("");

  // Navigation history
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Browser Back button support
  const goBackRef = useRef<() => void>(() => {});
  useEffect(() => { goBackRef.current = goBack; });
  useEffect(() => {
    const handler = () => goBackRef.current();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Sources (loaded separately after article)
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const fetchSources = async (t: string) => {
    setSourcesLoading(true);
    setSources([]);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch {
      setSources([]);
    } finally {
      setSourcesLoading(false);
    }
  };

  // Today in History state
  const [todayOpen, setTodayOpen] = useState(false);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  const fetchTodayEvents = async () => {
    if (todayEvents.length > 0) { setTodayOpen((v) => !v); return; }
    setTodayOpen(true);
    setTodayLoading(true);
    try {
      const res = await fetch("/api/today");
      const data = await res.json();
      setTodayEvents(data.events ?? []);
      setTodayLabel(`${data.day} ב${data.monthName}`);
    } catch {
      setTodayEvents([]);
    } finally {
      setTodayLoading(false);
    }
  };

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Loading steps animation
  const [loadingStep, setLoadingStep] = useState(0);
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  // Side panel state + history
  const [sidePanel, setSidePanel] = useState<{
    term: string;
    article: SidePanelArticle | null;
    loading: boolean;
    parentTopic: string;
  } | null>(null);
  const [sidePanelHistory, setSidePanelHistory] = useState<{
    term: string;
    article: SidePanelArticle | null;
    parentTopic: string;
  }[]>([]);

  const generateArticle = async (t: string, addToHistory = false) => {
    const trimmed = t.trim();
    if (!trimmed) return;

    // Push current article to history before navigating
    if (addToHistory && article) {
      setHistory((h) => [...h, { topic, article, images }]);
      window.history.pushState({}, "");
    } else if (!addToHistory) {
      setHistory([]); // New search clears history
    }

    setLoading(true);
    setLoadingTopic(trimmed);
    setError("");
    setArticle(null);
    setImages([]);
    setSources([]);
    setTopic(trimmed);
    setSidePanel(null);
    setSidePanelHistory([]);
    setChatOpen(false);
    setChatMessages([]);

    try {
      const res = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setArticle(data.article);
        setImages(data.images ?? []);
        fetchSources(trimmed);
      }
    } catch {
      setError("שגיאת רשת. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setArticle(prev.article);
    setImages(prev.images);
    setTopic(prev.topic);
    setSidePanel(null);
    setSidePanelHistory([]);
  };

  const goToHistoryEntry = (index: number) => {
    const entry = history[index];
    setHistory((h) => h.slice(0, index));
    setArticle(entry.article);
    setImages(entry.images);
    setTopic(entry.topic);
    setSidePanel(null);
    setSidePanelHistory([]);
  };

  const getArticleContext = () => {
    if (!article) return "";
    return article.sections
      .map((s) => `${s.heading}:\n${s.content}`)
      .join("\n\n");
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: text },
    ];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          articleContext: getArticleContext(),
          messages: newMessages,
        }),
      });
      const data = await res.json();
      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: data.response ?? data.error ?? "שגיאה" },
      ]);
    } catch {
      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: "שגיאת רשת. נסה שוב." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sidePanelGoBack = () => {
    if (sidePanelHistory.length === 0) return;
    const prev = sidePanelHistory[sidePanelHistory.length - 1];
    setSidePanelHistory((h) => h.slice(0, -1));
    setSidePanel({ term: prev.term, article: prev.article, loading: false, parentTopic: prev.parentTopic });
  };

  // parentTopicOverride: undefined = use article topic, "" = no context (e.g. Today in History)
  const openSidePanel = async (term: string, surroundingText = "", parentTopicOverride?: string) => {
    // Push current panel to history if one is already open
    if (sidePanel && sidePanel.article) {
      setSidePanelHistory((h) => [
        ...h,
        { term: sidePanel.term, article: sidePanel.article, parentTopic: sidePanel.parentTopic },
      ]);
    }
    const effectiveParentTopic = parentTopicOverride !== undefined ? parentTopicOverride : topic;
    setSidePanel({ term, article: null, loading: true, parentTopic: effectiveParentTopic });

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, parentTopic: effectiveParentTopic, surroundingText }),
      });
      const data = await res.json();
      if (data.error) setSidePanel({ term, article: null, loading: false, parentTopic: effectiveParentTopic });
      else setSidePanel({ term, article: data.article, loading: false, parentTopic: effectiveParentTopic });
    } catch {
      setSidePanel({ term, article: null, loading: false, parentTopic: effectiveParentTopic });
    }
  };

  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen" style={{ background: "#f4efe3" }}>
      {/* ── Masthead ── */}
      <header className="bg-black text-white">
        <div className="flex justify-between items-center px-6 py-1 border-b border-stone-700 text-xs text-stone-400">
          <span>{today}</span>
          <span>מגזין היסטוריה חינוכי לתיכון</span>
        </div>
        <div className="text-center py-5 border-b-4 border-amber-500">
          <h1
            className="text-6xl font-black tracking-tight leading-none"
            style={{ fontFamily: "var(--font-frank)" }}
          >
            עיתון הזמן
          </h1>
          <p className="text-amber-400 text-xs mt-2 tracking-[0.2em] uppercase">
            הקשרים • הכוחות • הסכסוכים שעיצבו את ההיסטוריה
          </p>
        </div>
        <div className="py-3 px-6 flex justify-center border-b border-stone-700">
          <button
            onClick={fetchTodayEvents}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              todayOpen
                ? "bg-amber-500 text-black border-amber-500"
                : "border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black"
            }`}
          >
            <span>📅</span>
            <span>היום בהיסטוריה</span>
            {todayLabel && <span className="opacity-70">— {todayLabel}</span>}
          </button>
        </div>

        <div className="py-4 px-6 flex justify-center gap-3 border-b border-stone-700">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateArticle(topic)}
            placeholder="חפש נושא היסטורי..."
            className="w-80 bg-stone-800 text-white placeholder-stone-500 border border-stone-600 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => generateArticle(topic)}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-600 text-black font-bold px-5 py-2 rounded text-sm transition-colors"
          >
            {loading ? "...יוצר" : "צור כתבה"}
          </button>
        </div>
      </header>

      {/* ── Today in History Panel ── */}
      {todayOpen && (
        <div className="bg-stone-900 border-b-2 border-amber-500 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-400 text-sm font-black uppercase tracking-widest">
                📅 היום בהיסטוריה{todayLabel ? ` — ${todayLabel}` : ""}
              </h3>
              <button onClick={() => setTodayOpen(false)} className="text-stone-500 hover:text-white text-lg">✕</button>
            </div>

            {todayLoading && (
              <div className="text-stone-400 text-sm py-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span> מחפש אירועים היסטוריים לתאריך זה...
              </div>
            )}

            {!todayLoading && todayEvents.length > 0 && (
              <div className="space-y-2">
                {[...todayEvents]
                  .sort((a, b) => {
                    const toNum = (y: string) => {
                      const bce = /לפנה|bce|bc/i.test(y);
                      const n = parseInt(y.replace(/[^\d]/g, ""), 10) || 0;
                      return bce ? -n : n;
                    };
                    return toNum(a.year) - toNum(b.year);
                  })
                  .map((ev, i) => (
                  <div key={i} className="flex gap-3 items-baseline group">
                    <span className="text-amber-500 font-black text-sm w-12 shrink-0 text-left">{ev.year}</span>
                    <button
                      onClick={() => { openSidePanel(ev.name, ev.summary, ""); setTodayOpen(false); }}
                      className="text-white hover:text-amber-400 font-bold text-sm underline decoration-dotted text-right"
                    >
                      {ev.name}
                    </button>
                    <span className="text-stone-400 text-xs hidden group-hover:inline">— {ev.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Standalone Spotlight (no article open) ── */}
      {sidePanel && !article && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="border-2 border-amber-500 bg-white shadow-lg" style={{ fontFamily: "var(--font-frank)" }}>
            <div className="bg-amber-500 px-4 py-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-xs text-amber-900 uppercase tracking-wide mb-0.5">זרקור</p>
                  <h4 className="font-black text-base text-black leading-tight">{sidePanel.term}</h4>
                </div>
                <button onClick={() => { setSidePanel(null); setSidePanelHistory([]); }} className="text-black hover:text-stone-700 text-xl font-black">✕</button>
              </div>
              {sidePanelHistory.length > 0 && (
                <button
                  onClick={sidePanelGoBack}
                  className="mt-2 flex items-center gap-1 text-xs text-amber-900 hover:text-black font-bold"
                >
                  <span>→</span>
                  <span>חזור: {sidePanelHistory[sidePanelHistory.length - 1].term}</span>
                </button>
              )}
            </div>

            {sidePanel.loading && (
              <div className="p-8 text-center text-stone-500">
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-sm">מחפש מידע על {sidePanel.term}...</p>
              </div>
            )}

            {!sidePanel.loading && sidePanel.article && (
              <div className="p-5">
                <h5 className="font-black text-lg mb-3 border-b border-stone-200 pb-2">{sidePanel.article.title}</h5>
                <p className="text-sm leading-relaxed mb-4 border-r-2 border-amber-400 pr-3 text-stone-700">{sidePanel.article.intro}</p>
                {sidePanel.article.sections.map((s, i) => (
                  <div key={i} className="mb-4">
                    <h6 className="font-black text-xs uppercase tracking-wide border-b border-stone-200 mb-2 pb-1">{s.heading}</h6>
                    <FormattedText text={s.content} onLinkClick={openSidePanel} small />
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-stone-200">
                  <button
                    onClick={() => { setSidePanel(null); generateArticle(sidePanel.term); }}
                    className="w-full bg-stone-900 hover:bg-stone-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    פתח כתבה מלאה על &quot;{sidePanel.term}&quot; ←
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Home: suggested topics ── */}
      {!article && !loading && (
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <p className="text-stone-500 text-sm mb-4 tracking-wide">── בחר נושא להתחיל ──</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => generateArticle(t)}
                className="border border-stone-400 hover:border-amber-600 hover:bg-amber-50 text-stone-700 hover:text-amber-800 text-sm px-4 py-2 rounded-full transition-colors"
                style={{ fontFamily: "var(--font-frank)" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="max-w-xl mx-auto px-6 text-center py-20">
          <div className="text-5xl mb-5">🗞️</div>
          <p
            className="text-2xl font-black mb-1"
            style={{ fontFamily: "var(--font-frank)" }}
          >
            {loadingTopic}
          </p>
          <p className="text-stone-400 text-sm mb-8">עיתון הזמן עובד על הכתבה שלך</p>

          {/* Steps list */}
          <div className="text-right space-y-3">
            {LOADING_STEPS.map((step, i) => {
              const isDone = i < loadingStep;
              const isCurrent = i === loadingStep;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2 rounded transition-all duration-500 ${
                    isCurrent
                      ? "bg-amber-100 border border-amber-400 text-stone-900"
                      : isDone
                      ? "text-stone-400"
                      : "text-stone-300"
                  }`}
                >
                  <span className="text-lg w-7 text-center">
                    {isDone ? "✓" : isCurrent ? step.emoji : "○"}
                  </span>
                  <span
                    className={`text-sm ${isCurrent ? "font-bold" : ""}`}
                  >
                    {step.text}
                  </span>
                  {isCurrent && (
                    <span className="mr-auto flex gap-0.5">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                          style={{ animationDelay: `${d * 150}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">{error}</div>
        </div>
      )}

      {/* ── Article + Side Panel ── */}
      {article && (
        <div className={`px-4 py-6 ${sidePanel || chatOpen ? "flex gap-4 items-start max-w-7xl mx-auto" : "max-w-5xl mx-auto"}`}>

          {/* ════ MAIN ARTICLE ════ */}
          <div className={`${sidePanel || chatOpen ? "w-3/5 min-w-0" : "w-full"} bg-white shadow-md p-6`}>

            {/* Back button + Breadcrumb */}
            {history.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-600 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                >
                  <span>→</span>
                  <span>חזור: {history[history.length - 1].topic}</span>
                </button>
                <div className="flex items-center gap-1 text-xs text-stone-400 flex-wrap">
                  {history.map((h, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <button onClick={() => goToHistoryEntry(i)} className="hover:text-amber-700 hover:underline">
                        {h.topic}
                      </button>
                      <span>›</span>
                    </span>
                  ))}
                  <span className="font-bold text-stone-700">{topic}</span>
                </div>
              </div>
            )}

            {/* Headline */}
            <div className="border-y-4 border-black py-4 mb-2 text-center">
              <h2
                className="text-5xl leading-tight mb-3"
                style={{ fontFamily: "var(--font-secular)" }}
              >
                {article.title}
              </h2>
              <p className="text-xl text-stone-600 font-light">{article.subtitle}</p>
            </div>
            <div className="flex gap-1 mb-4">
              <div className="flex-1 h-1 bg-black" />
              <div className="flex-1 h-px bg-black mt-0.5" />
            </div>

            {/* Intro */}
            <p
              className="text-lg leading-relaxed font-medium border-r-4 border-amber-600 pr-4 mb-6"
              style={{ fontFamily: "var(--font-frank)" }}
            >
              {article.intro}
            </p>

            <div className="border-b border-stone-400 mb-5" />

            {/* 3-column body */}
            <div className="newspaper-columns">
              {article.sections.map((section, i) => (
                <div key={i} className="column-section">
                  <h3
                    className="font-black text-base border-b-2 border-black mb-2 pb-1 uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-frank)" }}
                  >
                    <button
                      onClick={() => openSidePanel(section.heading, section.content.replace(/\*\*/g, "").slice(0, 600))}
                      className="hover:text-amber-700 transition-colors text-right w-full flex items-center gap-2 group"
                      title={`פתח זרקור: ${section.heading}`}
                    >
                      <span>{section.heading}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-amber-500 text-xs font-normal normal-case transition-opacity">
                        🔍
                      </span>
                    </button>
                  </h3>
                  <FormattedText text={section.content} onLinkClick={openSidePanel} />
                </div>
              ))}
            </div>

            {/* Timeline */}
            {article.timeline && article.timeline.length > 0 && (
              <div className="mt-8 border-t-4 border-black pt-4" style={{ background: "#ede8da" }}>
                <h3
                  className="text-xl font-black mb-4 tracking-wide text-center"
                  style={{ fontFamily: "var(--font-frank)" }}
                >
                  ── ציר הזמן ──
                </h3>
                <div className="timeline-container px-4 pb-4">
                  <div className="timeline-rail" dir="ltr">
                    {article.timeline.map((event, i) => (
                      <div key={i} className="timeline-event">
                        <div className="timeline-dot" />
                        <span className="timeline-year">{event.year}</span>
                        <span className="timeline-desc">{event.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Related topics */}
            {article.connections && article.connections.length > 0 && (
              <div className="mt-6 border border-stone-400 p-4 bg-amber-50">
                <h4
                  className="font-black text-sm mb-3 uppercase tracking-widest border-b border-stone-400 pb-2"
                  style={{ fontFamily: "var(--font-frank)" }}
                >
                  נושאים קשורים לחקירה
                </h4>
                <div className="flex flex-wrap gap-2">
                  {article.connections.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => generateArticle(c, true)}
                      className="border border-amber-600 hover:bg-amber-600 hover:text-white text-amber-800 text-sm px-3 py-1.5 rounded transition-colors"
                      style={{ fontFamily: "var(--font-frank)" }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            <div className="mt-8 border-t-2 border-stone-900 pt-4">
              <h3
                className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ fontFamily: "var(--font-frank)" }}
              >
                <span>📚</span> מקורות ולמידה נוספת
              </h3>

              {sourcesLoading && (
                <div className="flex items-center gap-2 text-stone-400 text-sm py-2">
                  <span className="animate-spin">⏳</span>
                  <span>מאתר מקורות אקדמיים...</span>
                </div>
              )}

              {!sourcesLoading && sources.length > 0 && (
                <ol className="space-y-3">
                  {sources.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm border-b border-stone-100 pb-3 last:border-0">
                      <span className="text-amber-600 font-black w-5 shrink-0">{i + 1}.</span>
                      <div>
                        <span className="font-bold text-stone-900">{s.title}</span>
                        {s.author && (
                          <span className="text-stone-500 italic"> — {s.author}</span>
                        )}
                        {s.description && (
                          <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{s.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {!sourcesLoading && sources.length === 0 && (
                <p className="text-stone-400 text-xs">לא נמצאו מקורות.</p>
              )}
            </div>

            <div className="mt-6 border-t border-stone-300 pt-4 flex justify-between items-center">
              <button
                onClick={() => { setArticle(null); setImages([]); setTopic(""); setSidePanel(null); setChatOpen(false); setChatMessages([]); }}
                className="text-stone-500 hover:text-black text-sm underline"
              >
                ← חזור לדף הבית
              </button>
              <button
                onClick={() => { setChatOpen((v) => !v); setSidePanel(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${
                  chatOpen
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-800 border-stone-800 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <span>💬</span>
                <span>{chatOpen ? "סגור צ׳אט" : "שאל את העורך"}</span>
              </button>
            </div>
          </div>

          {/* ════ CHAT PANEL ════ */}
          {chatOpen && (
            <div
              className="w-2/5 min-w-0 sticky top-4 self-start flex flex-col border-2 border-stone-800 bg-white shadow-lg"
              style={{ height: "calc(100vh - 6rem)", fontFamily: "var(--font-frank)" }}
            >
              {/* Header */}
              <div className="bg-stone-900 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">שאל את העורך</p>
                  <h4 className="font-black text-sm leading-tight">{topic}</h4>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-stone-400 hover:text-white text-xl font-black"
                >✕</button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-stone-400 text-sm mt-8 space-y-3">
                    <div className="text-4xl">💬</div>
                    <p className="font-bold text-stone-600">יש לך שאלה על הכתבה?</p>
                    <p className="text-xs">למשל: "איך הצליחו לשמור בסוד את הסלילה?" או "מי הרוויח הכי הרבה?"</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-amber-500 text-black font-medium"
                          : "bg-stone-100 text-stone-800 border border-stone-200"
                      }`}
                    >
                      {msg.content.split(/\n\n+/).map((para, pi) => (
                        <p key={pi} className={pi > 0 ? "mt-2" : ""}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-stone-100 border border-stone-200 rounded-lg px-4 py-3 flex gap-1">
                      {[0,1,2].map((d) => (
                        <span key={d} className="w-2 h-2 rounded-full bg-stone-400 animate-bounce"
                          style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-stone-200 p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="שאל שאלה על הכתבה..."
                  disabled={chatLoading}
                  className="flex-1 border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-600 disabled:bg-stone-50"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-stone-900 hover:bg-stone-700 disabled:bg-stone-300 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                >
                  שלח
                </button>
              </div>
            </div>
          )}

          {/* ════ SIDE PANEL ════ */}
          {sidePanel && (
            <div
              className="w-2/5 min-w-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto border-2 border-amber-500 bg-white shadow-lg"
              style={{ fontFamily: "var(--font-frank)" }}
            >
              {/* Side panel header */}
              <div className="bg-amber-500 px-4 py-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs text-amber-900 uppercase tracking-wide mb-0.5">זרקור</p>
                    <h4 className="font-black text-base text-black leading-tight">{sidePanel.term}</h4>
                    {sidePanel.parentTopic && (
                      <p className="text-xs text-amber-900 mt-0.5">בהקשר: {sidePanel.parentTopic}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSidePanel(null); setSidePanelHistory([]); }}
                    className="text-black hover:text-stone-700 text-xl font-black leading-none flex-shrink-0 mt-0.5"
                    title="סגור"
                  >✕</button>
                </div>
                {sidePanelHistory.length > 0 && (
                  <button
                    onClick={sidePanelGoBack}
                    className="mt-2 flex items-center gap-1 text-xs text-amber-900 hover:text-black font-bold"
                  >
                    <span>→</span>
                    <span>חזור: {sidePanelHistory[sidePanelHistory.length - 1].term}</span>
                  </button>
                )}
              </div>

              {/* Loading */}
              {sidePanel.loading && (
                <div className="p-6 text-center text-stone-500">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="text-sm">מחפש מידע על {sidePanel.term}...</p>
                </div>
              )}

              {/* Side panel content */}
              {!sidePanel.loading && sidePanel.article && (
                <div className="p-4">
                  <h5 className="font-black text-base mb-3 border-b border-stone-200 pb-2">
                    {sidePanel.article.title}
                  </h5>

                  <p className="text-sm leading-relaxed mb-4 border-r-2 border-amber-400 pr-3 text-stone-700">
                    {sidePanel.article.intro}
                  </p>

                  {sidePanel.article.sections.map((s, i) => (
                    <div key={i} className="mb-4">
                      <h6 className="font-black text-xs uppercase tracking-wide border-b border-stone-200 mb-2 pb-1">
                        {s.heading}
                      </h6>
                      <FormattedText
                        text={s.content}
                        onLinkClick={openSidePanel}
                        small
                      />
                    </div>
                  ))}

                  {/* Side panel connections */}
                  {sidePanel.article.connections.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200">
                      <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">עוד נושאים</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sidePanel.article.connections.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => openSidePanel(c)}
                            className="border border-amber-400 hover:bg-amber-400 text-amber-800 hover:text-black text-xs px-2 py-1 rounded transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open as full article */}
                  <div className="mt-4 pt-3 border-t border-stone-200">
                    <button
                      onClick={() => generateArticle(sidePanel.term, true)}
                      className="w-full bg-stone-900 hover:bg-stone-700 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      פתח כתבה מלאה על &quot;{sidePanel.term}&quot; ←
                    </button>
                  </div>
                </div>
              )}

              {/* Error in side panel */}
              {!sidePanel.loading && !sidePanel.article && (
                <div className="p-4 text-sm text-red-600">לא ניתן לטעון מידע. נסה שוב.</div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
