import airports from "../data/airports.json";

/**
 * Resolves free-text location data (a state, city, or venue string) to an
 * IATA airport code using src/data/airports.json. Checks for an exact key
 * match first, then falls back to a substring match so messy strings like
 * "Dome Event Centre, Asaba, Delta State" still resolve via "asaba"
 * appearing inside them.
 *
 * @param {string|null|undefined} text
 * @returns {string|null} the IATA code, or null if nothing matches
 */
export function resolveAirportCode(text) {
  if (!text) return null;
  const normalized = String(text).trim().toLowerCase();
  if (!normalized) return null;

  if (airports[normalized]) return airports[normalized];

  const match = Object.keys(airports).find((key) =>
    normalized.includes(key),
  );
  return match ? airports[match] : null;
}
