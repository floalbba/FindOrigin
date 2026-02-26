import { NextRequest, NextResponse } from "next/server";
import { sendChatAction, sendMessage } from "@/lib/telegram";
import { getTextFromInput } from "@/lib/text-source";
import { extractEntities, buildSearchQuery } from "@/lib/entities";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

function formatEntitiesReply(entities: ReturnType<typeof extractEntities>): string {
  const lines: string[] = ["<b>Извлечённые сущности:</b>"];

  if (entities.claims.length > 0) {
    lines.push(`\n<b>Утверждения:</b>\n• ${entities.claims.join("\n• ")}`);
  }
  if (entities.dates.length > 0) {
    lines.push(`\n<b>Даты:</b> ${entities.dates.join(", ")}`);
  }
  if (entities.numbers.length > 0) {
    lines.push(`\n<b>Числа:</b> ${entities.numbers.join(", ")}`);
  }
  if (entities.names.length > 0) {
    lines.push(`\n<b>Имена:</b> ${entities.names.join(", ")}`);
  }
  if (entities.links.length > 0) {
    lines.push(`\n<b>Ссылки:</b>\n${entities.links.join("\n")}`);
  }

  const query = buildSearchQuery(entities);
  lines.push(`\n<b>Поисковый запрос:</b> ${query}`);
  lines.push("\n<i>Поиск источников будет добавлен на следующем этапе.</i>");

  return lines.join("");
}

export async function POST(req: NextRequest) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN не задан");
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
      "Отправьте текст или ссылку на Telegram-пост, и я извлеку ключевые сущности " +
      "(утверждения, даты, имена, ссылки) и подготовлю поисковый запрос.\n\n" +
      "Поиск источников будет добавлен на следующем этапе.";
    await sendMessage(chatId, helpText, token);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await sendChatAction(chatId, "typing", token);

  const sourceResult = getTextFromInput(text);

  if (sourceResult.error) {
    await sendMessage(chatId, sourceResult.error, token);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!sourceResult.text) {
    await sendMessage(chatId, "Введите текст или ссылку на пост.", token);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const entities = extractEntities(sourceResult.text);
  const reply = formatEntitiesReply(entities);

  await sendMessage(chatId, reply, token);

  return NextResponse.json({ ok: true }, { status: 200 });
}
