/**
 * Извлечение ключевых сущностей из текста:
 * - ключевые утверждения (факты, тезисы)
 * - даты
 * - числа
 * - имена (персоны, организации)
 * - ссылки
 */

export interface ExtractedEntities {
  claims: string[];
  dates: string[];
  numbers: string[];
  names: string[];
  links: string[];
}

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

const DATE_PATTERNS = [
  /\d{1,2}[./]\d{1,2}[./]\d{2,4}/g,
  /\d{4}-\d{2}-\d{2}/g,
  /\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{2,4}/gi,
  /(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{1,2},?\s*\d{4}/gi,
];

const NUMBER_REGEX = /\b\d+(?:[.,]\d+)?(?:%|₽|\$|€|тыс\.?|млн|млрд)?\b/gi;

/** Слова, исключаемые из кандидатов в имена (местоимения, предлоги и т.д.) */
const STOP_WORDS = new Set([
  "и", "в", "на", "с", "по", "для", "из", "к", "о", "от", "до", "при", "за",
  "это", "что", "как", "так", "или", "но", "а", "если", "когда", "где",
  "он", "она", "оно", "они", "мы", "вы", "я", "его", "её", "их",
  "год", "лет", "раз", "день", "время", "человек", "людей",
]);

/**
 * Извлекает ссылки из текста
 */
function extractLinks(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return [...new Set(matches)];
}

/**
 * Извлекает даты из текста
 */
function extractDates(text: string): string[] {
  const dates: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    dates.push(...matches);
  }
  return [...new Set(dates)];
}

/**
 * Извлекает числа из текста
 */
function extractNumbers(text: string): string[] {
  const matches = text.match(NUMBER_REGEX) ?? [];
  return [...new Set(matches)];
}

/**
 * Извлекает кандидатов в имена: слова с заглавной буквы (кроме начала предложения)
 * и последовательности из 2+ слов с заглавной
 */
function extractNames(text: string): string[] {
  const words = text.split(/\s+/);
  const names: string[] = [];
  let i = 0;

  while (i < words.length) {
    const word = words[i].replace(/[^\p{L}\p{N}-]/gu, "");
    if (
      word.length >= 2 &&
      /^[А-ЯA-Z]/.test(word) &&
      !STOP_WORDS.has(word.toLowerCase())
    ) {
      const sequence: string[] = [word];
      let j = i + 1;
      while (
        j < words.length &&
        /^[А-ЯA-Z]/.test(words[j].replace(/[^\p{L}\p{N}-]/gu, ""))
      ) {
        sequence.push(words[j].replace(/[^\p{L}\p{N}-]/gu, ""));
        j++;
      }
      if (sequence.length >= 1) {
        names.push(sequence.join(" "));
      }
      i = j;
    } else {
      i++;
    }
  }

  return [...new Set(names)];
}

/**
 * Извлекает ключевые утверждения — предложения, содержащие факты
 * (содержат числа, даты или имена)
 */
function extractClaims(text: string, entities: Partial<ExtractedEntities>): string[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const claims = sentences.filter((s) => {
    const hasNumber = entities.numbers?.some((n) => s.includes(n)) ?? false;
    const hasDate = entities.dates?.some((d) => s.includes(d)) ?? false;
    const hasName = entities.names?.some((n) => s.includes(n)) ?? false;
    return hasNumber || hasDate || hasName;
  });

  return claims.slice(0, 5);
}

/**
 * Извлекает все сущности из текста
 */
export function extractEntities(text: string): ExtractedEntities {
  const links = extractLinks(text);
  const dates = extractDates(text);
  const numbers = extractNumbers(text);
  const names = extractNames(text);
  const claims = extractClaims(text, { dates, numbers, names });

  return {
    claims,
    dates,
    numbers,
    names,
    links,
  };
}

/**
 * Формирует поисковый запрос из извлечённых сущностей
 */
export function buildSearchQuery(entities: ExtractedEntities): string {
  const parts: string[] = [];

  if (entities.claims.length > 0) {
    parts.push(entities.claims[0]);
  }
  if (entities.names.length > 0) {
    parts.push(...entities.names.slice(0, 3));
  }
  if (entities.dates.length > 0) {
    parts.push(entities.dates[0]);
  }

  return parts.join(" ").trim() || "источник";
}
