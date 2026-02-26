/**
 * OpenRouter API — openrouter/free автоматически выбирает доступную бесплатную модель
 * (обход rate limit конкретных моделей)
 * https://openrouter.ai/docs
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";

export interface SourceSuggestion {
  url: string;
  title: string;
  confidence: "высокая" | "средняя" | "низкая";
  description?: string;
}

export interface FindOriginResult {
  sources: SourceSuggestion[];
  summary?: string;
}

const SYSTEM_PROMPT = `Ты — помощник FindOrigin, бот для поиска источников информации.
Получаешь текст от пользователя. Твоя задача: найти 1–3 возможных источника этой информации.

Источники ищи среди:
- официальных сайтов (госорганы, компании, организации)
- новостных сайтов
- блогов и медиа
- исследований, отчётов

Отвечай СТРОГО в формате JSON:
{
  "sources": [
    {
      "url": "https://...",
      "title": "Название источника",
      "confidence": "высокая" | "средняя" | "низкая",
      "description": "Краткое описание релевантности"
    }
  ],
  "summary": "Краткий вывод (1–2 предложения)"
}

Сравнивай смысл, а не текст буквально. Уверенность: высокая — источник почти наверняка содержит эту информацию; средняя — вероятно; низкая — возможно.
Если не можешь найти подходящие источники, верни пустой массив sources и объясни в summary.
Только валидный JSON, без markdown и пояснений.`;

export async function findSourcesWithAI(
  text: string,
  apiKey: string
): Promise<FindOriginResult> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Пустой ответ от AI");
  }

  let parsed: FindOriginResult;
  try {
    const jsonStr = content.replace(/```json\s*|\s*```/g, "").trim();
    parsed = JSON.parse(jsonStr) as FindOriginResult;
  } catch {
    throw new Error(`AI вернул невалидный JSON: ${content.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.sources)) {
    parsed.sources = [];
  }

  return parsed;
}
