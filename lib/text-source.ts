/**
 * Определение источника текста и его извлечение:
 * - текст напрямую
 * - ссылка на Telegram-пост (t.me, telegram.me)
 */

const TELEGRAM_LINK_REGEX =
  /https?:\/\/(t\.me|telegram\.me|telegram\.dog)\/([a-zA-Z0-9_]+)(?:\/(\d+))?/i;

export interface TextSourceResult {
  text: string;
  source: "direct" | "telegram_link";
  error?: string;
}

/**
 * Нормализует текст: убирает лишние пробелы и переносы
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

/**
 * Проверяет, является ли строка ссылкой на Telegram-пост
 */
export function isTelegramPostLink(text: string): boolean {
  return TELEGRAM_LINK_REGEX.test(text.trim());
}

/**
 * Извлекает текст из ввода пользователя.
 * Для прямого текста — возвращает как есть.
 * Для ссылок на Telegram — пока возвращает заглушку (Bot API не позволяет
 * получить содержимое поста по ссылке без TDLib/доп. сервисов).
 */
export function getTextFromInput(input: string): TextSourceResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { text: "", source: "direct", error: "Пустой ввод" };
  }

  if (isTelegramPostLink(trimmed)) {
    return {
      text: trimmed,
      source: "telegram_link",
      error:
        "Извлечение текста из ссылок на Telegram-посты пока не реализовано. " +
        "Скопируйте текст поста и вставьте его сюда.",
    };
  }

  return {
    text: normalizeText(trimmed),
    source: "direct",
  };
}
