import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { sendChatAction, sendMessage } from "@/lib/telegram";
import { getTextFromInput } from "@/lib/text-source";
import { findSourcesWithAI, type SourceSuggestion } from "@/lib/ai";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

function formatSourcesReply(sources: SourceSuggestion[], summary?: string): string {
  const lines: string[] = ["<b>Возможные источники:</b>\n"];

  if (sources.length === 0) {
    lines.push(summary ? `<i>${summary}</i>` : "Источники не найдены.");
    return lines.join("");
  }

  sources.forEach((s, i) => {
    lines.push(`${i + 1}. <a href="${s.url}">${s.title}</a>`);
    if (s.description) lines.push(`   ${s.description}`);
    lines.push(`   Уверенность: ${s.confidence}\n`);
  });

  if (summary) {
    lines.push(`\n<i>${summary}</i>`);
  }

  return lines.join("");
}

export async function POST(req: NextRequest) {
  const token = process.env.BOT_TOKEN;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!token) {
    console.error("BOT_TOKEN не задан");
    return NextResponse.json({ error: "Server config" }, { status: 500 });
  }

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY не задан");
    return NextResponse.json({ error: "Server config" }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (!chatId || text === undefined) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (text === "/start" || text === "/help") {
    const helpText =
      "<b>FindOrigin</b> — бот для поиска источников информации.\n\n" +
      "• Отправьте текст — найду возможные источники (официальные сайты, новости, блоги).\n" +
      "• Или откройте Mini App через кнопку меню (если настроена).";
    await sendMessage(chatId, helpText, token);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const sourceResult = getTextFromInput(text);

  if (sourceResult.error) {
    await sendMessage(chatId, sourceResult.error, token);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!sourceResult.text) {
    await sendMessage(chatId, "Введите текст или ссылку на пост.", token);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const textToProcess = sourceResult.text;
  after(async () => {
    await sendChatAction(chatId, "typing", token);
    try {
      const result = await findSourcesWithAI(textToProcess, apiKey);
      const reply = formatSourcesReply(result.sources, result.summary);
      await sendMessage(chatId, reply, token);
    } catch (err) {
      console.error("AI error:", err);
      const msg = err instanceof Error ? err.message : "Ошибка при поиске источников.";
      await sendMessage(chatId, `Ошибка: ${msg}`, token);
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
