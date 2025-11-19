//
// Utilities for safely persisting notes to browser localStorage
//

// The key to use for localStorage
const STORAGE_KEY = 'notes.v1';

/**
 * PUBLIC_INTERFACE
 * Loads notes from localStorage.
 * @returns {Array<{id: string, title: string, content: string, updatedAt: string}>}
 */
export function loadNotes() {
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        note =>
          typeof note === 'object' &&
          typeof note.id === 'string' &&
          typeof note.title === 'string' &&
          typeof note.updatedAt === 'string'
      );
    }
    return [];
  } catch (err) {
    // Swallow errors, return empty array if corrupt
    return [];
  }
}

/**
 * PUBLIC_INTERFACE
 * Saves notes to localStorage.
 * @param {Array} notes - Array of note objects.
 * @returns {void}
 */
export function saveNotes(notes) {
  try {
    if (!Array.isArray(notes)) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    // Silently fail if storage is unavailable/full
  }
}
