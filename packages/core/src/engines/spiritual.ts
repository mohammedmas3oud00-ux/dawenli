/**
 * Helpers for the spiritual habit presets (prayers, Quran, adhkar).
 * The `prayers` preset stores one status per prayer in `habit_logs.metadata`;
 * the numeric log value is the number of prayers that were not missed.
 */
import { PRAYERS, PRAYER_STATUSES, type Prayer, type PrayerStatus } from "../constants";

export type PrayerLog = Partial<Record<Prayer, PrayerStatus>>;

export function isPrayerStatus(value: unknown): value is PrayerStatus {
  return typeof value === "string" && (PRAYER_STATUSES as readonly string[]).includes(value);
}

/** Keeps only valid prayer keys/statuses from arbitrary metadata. */
export function normalisePrayerLog(metadata: unknown): PrayerLog {
  const out: PrayerLog = {};
  if (!metadata || typeof metadata !== "object") return out;
  for (const prayer of PRAYERS) {
    const status = (metadata as Record<string, unknown>)[prayer];
    if (isPrayerStatus(status)) out[prayer] = status;
  }
  return out;
}

/** Number of prayers performed (anything but `missed`). */
export function prayersPerformed(log: PrayerLog): number {
  return PRAYERS.filter((p) => log[p] !== undefined && log[p] !== "missed").length;
}

/**
 * Quality score 0..100: jamaah = 1, on_time = 0.9, late = 0.5, missed = 0.
 * Unlogged prayers count as missed so a half-filled day is not rewarded.
 */
export function prayerQualityScore(log: PrayerLog): number {
  const weights: Record<PrayerStatus, number> = { jamaah: 1, on_time: 0.9, late: 0.5, missed: 0 };
  const total = PRAYERS.reduce((sum, p) => sum + (log[p] ? weights[log[p]!] : 0), 0);
  return Math.round((100 * total) / PRAYERS.length);
}
