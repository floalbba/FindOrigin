import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FindOrigin — Поиск источников",
  description: "Найдите источники информации с помощью AI",
  robots: "noindex, nofollow",
};

export default function TMALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <div style={{ margin: 0, padding: 0, minHeight: "100dvh" }}>
        {children}
      </div>
    </>
  );
}
