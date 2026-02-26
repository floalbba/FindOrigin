/**
 * OpenRouter API
 * Основная модель: gpt-oss-120b (высокое качество)
 * При rate limit (429): fallback на meta-llama/llama-3.3-70b-instruct:free
 * https://openrouter.ai/docs
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS = [
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
] as const;

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

async function callModel(
  model: string,
  text: string,
  apiKey: string
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    }),
  });
}

export async function findSourcesWithAI(
  text: string,
  apiKey: string
): Promise<FindOriginResult> {
  let lastError: Error | null = null;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    let res = await callModel(model, text, apiKey);

    if (res.status === 429 && i === 0) {
      await new Promise((r) => setTimeout(r, 3000));
      res = await callModel(model, text, apiKey);
    }

    if (res.ok) {
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        lastError = new Error("Пустой ответ от AI");
        continue;
      }
      try {
        const jsonStr = content.replace(/```json\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(jsonStr) as FindOriginResult;
        if (!Array.isArray(parsed.sources)) parsed.sources = [];
        return parsed;
      } catch {
        lastError = new Error(`AI вернул невалидный JSON: ${content.slice(0, 200)}`);
        continue;
      }
    }

    const errText = await res.text();
    lastError = new Error(`OpenRouter API error ${res.status}: ${errText}`);
    if (res.status === 429) continue;
    throw lastError;
  }

  throw lastError ?? new Error("Не удалось получить ответ от AI");
}
