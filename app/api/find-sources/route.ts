import { NextRequest, NextResponse } from "next/server";
import { getTextFromInput } from "@/lib/text-source";
import { findSourcesWithAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Server config" }, { status: 500 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json(
      { error: "Текст не указан" },
      { status: 400 }
    );
  }

  const sourceResult = getTextFromInput(text);

  if (sourceResult.error) {
    return NextResponse.json(
      { error: sourceResult.error },
      { status: 400 }
    );
  }

  if (!sourceResult.text) {
    return NextResponse.json(
      { error: "Введите текст или ссылку на пост" },
      { status: 400 }
    );
  }

  try {
    const result = await findSourcesWithAI(sourceResult.text, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI error:", err);
    const msg = err instanceof Error ? err.message : "Ошибка при поиске источников";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
