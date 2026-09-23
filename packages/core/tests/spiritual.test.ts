import {
  adhkarPerformed,
  isPrayerStatus,
  normaliseAdhkarLog,
  normalisePrayerLog,
  normaliseQuranLog,
  prayerQualityScore,
  prayersPerformed,
  quranProgressPercent,
} from "../src/engines/spiritual";

describe("normalisePrayerLog", () => {
  it("keeps only known prayers with valid statuses", () => {
    expect(
      normalisePrayerLog({ fajr: "jamaah", dhuhr: "nope", tahajjud: "on_time", isha: "missed" }),
    ).toEqual({ fajr: "jamaah", isha: "missed" });
  });

  it("tolerates non-object metadata", () => {
    expect(normalisePrayerLog(null)).toEqual({});
    expect(normalisePrayerLog("x")).toEqual({});
    expect(normalisePrayerLog(undefined)).toEqual({});
  });
});

describe("isPrayerStatus", () => {
  it("recognises the four statuses only", () => {
    expect(isPrayerStatus("late")).toBe(true);
    expect(isPrayerStatus("early")).toBe(false);
    expect(isPrayerStatus(1)).toBe(false);
  });
});

describe("prayersPerformed / prayerQualityScore", () => {
  it("counts everything but missed", () => {
    expect(prayersPerformed({ fajr: "jamaah", dhuhr: "late", asr: "missed" })).toBe(2);
    expect(prayersPerformed({})).toBe(0);
  });

  it("scores a perfect day at 100 and an empty day at 0", () => {
    expect(
      prayerQualityScore({ fajr: "jamaah", dhuhr: "jamaah", asr: "jamaah", maghrib: "jamaah", isha: "jamaah" }),
    ).toBe(100);
    expect(prayerQualityScore({})).toBe(0);
  });

  it("weights on_time and late below jamaah", () => {
    // 1 + 0.9 + 0.5 + 0 + (unlogged 0) = 2.4 / 5 → 48
    expect(prayerQualityScore({ fajr: "jamaah", dhuhr: "on_time", asr: "late", maghrib: "missed" })).toBe(48);
  });
});

describe("Quran helpers", () => {
  it("normalises Quran metadata safely", () => {
    expect(normaliseQuranLog({ pagesRead: 10, currentPage: 120, juz: 6 })).toEqual({
      pagesRead: 10,
      currentPage: 120,
      juz: 6,
    });
    expect(normaliseQuranLog(null, 5)).toEqual({ pagesRead: 5 });
    expect(normaliseQuranLog({ pagesRead: -2 })).toEqual({ pagesRead: 0 });
    expect(normaliseQuranLog({ currentPage: 700 })).toEqual({ pagesRead: 0, currentPage: 604 });
  });

  it("computes progress percent correctly", () => {
    expect(quranProgressPercent(5, 20)).toBe(25);
    expect(quranProgressPercent(25, 20)).toBe(100);
    expect(quranProgressPercent(0, 20)).toBe(0);
    expect(quranProgressPercent(5, 0)).toBe(0);
  });
});

describe("Adhkar helpers", () => {
  it("normalises Adhkar metadata correctly", () => {
    expect(normaliseAdhkarLog({ morning: true, evening: false })).toEqual({
      morning: true,
      evening: false,
    });
    expect(normaliseAdhkarLog("invalid")).toEqual({});
  });

  it("counts adhkar completed correctly", () => {
    expect(adhkarPerformed({ morning: true, evening: true })).toBe(2);
    expect(adhkarPerformed({ morning: true })).toBe(1);
    expect(adhkarPerformed({ morning: false, evening: false })).toBe(0);
    expect(adhkarPerformed({})).toBe(0);
  });
});

