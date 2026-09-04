/**
 * Utility helpers for text formatting in PUNARVAAS
 */

export function formatHazard(hazard) {
  if (!hazard) return '';
  return hazard
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
