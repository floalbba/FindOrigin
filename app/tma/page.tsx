"use client";

import { useEffect, useState } from "react";

interface SourceSuggestion {
  url: string;
  title: string;
  confidence: string;
  description?: string;
}

interface FindResult {
  sources: SourceSuggestion[];
  summary?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export default function TMAPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FindResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();
  }, []);

  const handleSearch = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/find-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка запроса");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  const theme = tg?.themeParams ?? {};
  const bg = theme.bg_color || "#1c1c1e";
  const textColor = theme.text_color || "#ffffff";
  const hint = theme.hint_color || "#8e8e93";
  const link = theme.link_color || "#0a84ff";
  const button = theme.button_color || "#0a84ff";
  const buttonText = theme.button_text_color || "#ffffff";

  return (
    <>
      <main
        style={{
          minHeight: "100dvh",
          padding: "16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: bg,
          color: textColor,
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          FindOrigin
        </h1>
        <p style={{ fontSize: "14px", color: hint, marginBottom: "20px" }}>
          Вставьте текст или ссылку — найдём возможные источники
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст или ссылка на пост..."
          disabled={loading}
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "12px",
            fontSize: "15px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: textColor,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleSearch}
          disabled={loading || !text.trim()}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            fontSize: "16px",
            fontWeight: 600,
            borderRadius: "12px",
            border: "none",
            backgroundColor: loading ? `${button}80` : button,
            color: buttonText,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Поиск..." : "Найти источники"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "12px",
              backgroundColor: "rgba(255,59,48,0.2)",
              color: "#ff3b30",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <section style={{ marginTop: "24px" }}>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              Возможные источники
            </h2>

            {result.sources.length === 0 ? (
              <p style={{ fontSize: "14px", color: hint }}>
                {result.summary || "Источники не найдены."}
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {result.sources.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: link,
                        fontSize: "15px",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {s.title}
                    </a>
                    {s.description && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: "13px",
                          color: hint,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.description}
                      </p>
                    )}
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "6px",
                        fontSize: "12px",
                        color: hint,
                      }}
                    >
                      Уверенность: {s.confidence}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {result.summary && result.sources.length > 0 && (
              <p
                style={{
                  marginTop: "16px",
                  fontSize: "14px",
                  color: hint,
                  fontStyle: "italic",
                }}
              >
                {result.summary}
              </p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
