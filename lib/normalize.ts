/**
 * Normalize Romanian text: strip diacritics and lowercase.
 * Handles both standard (ș, ț) and legacy (ş, ţ) diacritics.
 */
const DIACRITICS: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ț: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ț: "t",
  ş: "s", ţ: "t", Ş: "s", Ţ: "t",
};

export function normalize(text: string): string {
  return text
    .replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, (m) => DIACRITICS[m] ?? m)
    .toLowerCase()
    .trim();
}

/**
 * Escape special characters for SQL LIKE patterns
 */
export function escapeLike(text: string): string {
  return text.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
