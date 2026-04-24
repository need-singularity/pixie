export type Lang = "ko" | "en" | "other";

const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/;
const LATIN_LETTER = /[A-Za-z]/g;
const ANY_LETTER = /\p{L}/gu;

export function detectLang(text: string): Lang {
  const stripped = text.replace(/<[@#!&][^>]+>|https?:\/\/\S+|:\w+:/g, "").trim();
  if (!stripped) return "other";

  if (HANGUL.test(stripped)) return "ko";

  const latin = stripped.match(LATIN_LETTER)?.length ?? 0;
  const all = stripped.match(ANY_LETTER)?.length ?? 0;
  if (latin >= 3 && latin / Math.max(all, 1) > 0.7) return "en";

  return "other";
}

export function target(src: Lang): Lang | null {
  if (src === "ko") return "en";
  if (src === "en") return "ko";
  return null;
}
