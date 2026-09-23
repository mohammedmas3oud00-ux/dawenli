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

/* =========================================================================
 * Quran Preset Helpers
 * ========================================================================= */

export type QuranLog = {
  pagesRead: number;
  currentPage?: number;
  juz?: number;
};

/**
 * Normalises Quran metadata and guarantees non-negative integer pagesRead.
 */
export function normaliseQuranLog(metadata: unknown, fallbackPages = 0): QuranLog {
  if (!metadata || typeof metadata !== "object") {
    return { pagesRead: Math.max(0, Math.floor(fallbackPages)) };
  }
  const raw = metadata as Record<string, unknown>;
  const pagesRaw = typeof raw.pagesRead === "number" ? raw.pagesRead : fallbackPages;
  const pagesRead = Math.max(0, Math.floor(Number(pagesRaw) || 0));

  const out: QuranLog = { pagesRead };
  if (typeof raw.currentPage === "number" && raw.currentPage > 0) {
    out.currentPage = Math.min(604, Math.floor(raw.currentPage));
  }
  if (typeof raw.juz === "number" && raw.juz >= 1 && raw.juz <= 30) {
    out.juz = Math.floor(raw.juz);
  }
  return out;
}

export function quranProgressPercent(pagesRead: number, targetPages: number): number {
  if (!targetPages || targetPages <= 0) return 0;
  return Math.min(100, Math.round((pagesRead / targetPages) * 100));
}

/* =========================================================================
 * Adhkar Preset Helpers
 * ========================================================================= */

export type AdhkarLog = {
  morning?: boolean;
  evening?: boolean;
};

/** Normalises Adhkar metadata (morning & evening checkboxes). */
export function normaliseAdhkarLog(metadata: unknown): AdhkarLog {
  const out: AdhkarLog = {};
  if (!metadata || typeof metadata !== "object") return out;
  const raw = metadata as Record<string, unknown>;
  if (typeof raw.morning === "boolean") out.morning = raw.morning;
  if (typeof raw.evening === "boolean") out.evening = raw.evening;
  return out;
}

/** Number of adhkar performed (0, 1, or 2). */
export function adhkarPerformed(log: AdhkarLog): number {
  let count = 0;
  if (log.morning) count += 1;
  if (log.evening) count += 1;
  return count;
}

