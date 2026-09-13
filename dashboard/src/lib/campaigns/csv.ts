import "server-only";

export interface ParsedRecipient {
  email: string;
  name: string | null;
}

const EMAIL_REGEX = /[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/;
const HEADER_ROW_REGEX = /^\s*(naam|name)\s*[,;]\s*(e-?mail)/i;

/** Leest zowel een geüploade CSV ("naam,email" of "email,naam") als handmatig
 * geplakte regels (één e-mailadres per regel, eventueel "Naam <email>") - beide
 * gaan door dezelfde soepele parser zodat er geen apart CSV-only pad nodig is. */
export function parseRecipientsText(text: string): ParsedRecipient[] {
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const results: ParsedRecipient[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || HEADER_ROW_REGEX.test(line)) continue;

    const match = line.match(EMAIL_REGEX);
    if (!match || match.index === undefined) continue;

    const email = match[0].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);

    let name = line.slice(0, match.index).replace(/["'<,;]+$/, "").replace(/^["',;]+/, "").trim();
    if (!name) {
      name = line
        .slice(match.index + match[0].length)
        .replace(/^["'>,;]+/, "")
        .replace(/["',;]+$/, "")
        .trim();
    }

    results.push({ email, name: name || null });
  }

  return results;
}
