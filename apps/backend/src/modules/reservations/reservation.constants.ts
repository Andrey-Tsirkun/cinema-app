/** Max active (held or confirmed) seats one user may have for a single session. */
export const MAX_SEATS_PER_USER_SESSION = 5;

/** Default hold window before auto-release (ms). Override with RESERVATION_HOLD_MS env. */
export function getReservationHoldDurationMs(): number {
  const raw = process.env.RESERVATION_HOLD_MS;
  if (raw === undefined || raw === '') {
    return 5 * 60 * 1000;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1000) {
    return 5 * 60 * 1000;
  }
  return Math.floor(n);
}
