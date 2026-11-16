/**
 * Normalize free-text input:
 * - remove leading whitespace
 * - collapse repeated spaces/tabs/newlines to one ordinary space
 */
export function normalizeSingleSpaces(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^ +/, '');
}

/**
 * Capitalize the first letter of every word and lowercase the remaining
 * letters. Word boundaries include spaces, hyphens, apostrophes, slashes,
 * periods and ampersands. A trailing space is preserved while typing.
 */
export function titleCaseWords(value) {
  const normalized = normalizeSingleSpaces(value);
  return normalized.replace(
    /(^|[\s\-/'’.&])([A-Za-z])([A-Za-z]*)/g,
    (_match, separator, first, rest) => separator + first.toUpperCase() + rest.toLowerCase()
  );
}

/** Email addresses must not contain whitespace or title casing. */
export function removeEmailWhitespace(value) {
  return String(value ?? '').replace(/\s/g, '');
}

/** Remove punctuation and symbols from ordinary free-text fields. */
export function lettersNumbersSpacesOnly(value) {
  return String(value ?? '').replace(/[^A-Za-z0-9 ]/g, '');
}

/** Count non-empty words separated by whitespace. */
export function countWords(value) {
  const text = String(value ?? '').trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Keep only the first `limit` words without changing their spelling. */
export function limitWords(value, limit) {
  const text = String(value ?? '');
  const matches = text.match(/\S+/g) || [];
  if (matches.length <= limit) return text;
  return matches.slice(0, limit).join(' ');
}
