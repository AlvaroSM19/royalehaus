/**
 * Normalize text for search comparison
 * Removes accents and diacritics to allow accent-insensitive search
 * e.g., "Príncipe" -> "principe", "Montañés" -> "montanes"
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove all diacritical marks
}

/**
 * Check if text includes searchTerm (accent-insensitive)
 */
export function includesNormalized(text: string, searchTerm: string): boolean {
  return normalizeForSearch(text).includes(normalizeForSearch(searchTerm));
}
