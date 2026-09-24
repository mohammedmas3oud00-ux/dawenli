import { inPeriod, periodFor, shiftPeriod } from "../src/engines/periods";

const SAT = 6;

describe("periodFor", () => {
  it("daily is the day itself", () => {
    expect(periodFor("daily", "2026-09-23", SAT)).toEqual({
      start: "2026-09-23",
      end: "2026-09-23",
    });
  });

  it("weekly honours the configured week start", () => {
    // 2026-09-23 is a Wednesday
    expect(periodFor("weekly", "2026-09-23", SAT)).toEqual({
      start: "2026-09-19",
      end: "2026-09-25",
    });
    expect(periodFor("weekly", "2026-09-23", 1)).toEqual({
      start: "2026-09-21",
      end: "2026-09-27",
    });
  });

  it("monthly covers the calendar month, including February", () => {
    expect(periodFor("monthly", "2026-09-23", SAT)).toEqual({
      start: "2026-09-01",
      end: "2026-09-30",
    });
    expect(periodFor("monthly", "2028-02-10", SAT)).toEqual({
      start: "2028-02-01",
      end: "2028-02-29",
    });
  });

  it("quarterly and yearly", () => {
    expect(periodFor("quarterly", "2026-09-23", SAT)).toEqual({
      start: "2026-07-01",
      end: "2026-09-30",
    });
    expect(periodFor("quarterly", "2026-12-31", SAT)).toEqual({
      start: "2026-10-01",
      end: "2026-12-31",
    });
    expect(periodFor("yearly", "2026-09-23", SAT)).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });
});

describe("shiftPeriod", () => {
  it("moves to adjacent periods", () => {
    const week = periodFor("weekly", "2026-09-23", SAT);
    expect(shiftPeriod("weekly", week, -1, SAT)).toEqual({
      start: "2026-09-12",
      end: "2026-09-18",
    });
    expect(shiftPeriod("weekly", week, 1, SAT)).toEqual({ start: "2026-09-26", end: "2026-10-02" });

    const month = periodFor("monthly", "2026-01-15", SAT);
    expect(shiftPeriod("monthly", month, -1, SAT)).toEqual({
      start: "2025-12-01",
      end: "2025-12-31",
    });
  });
});

describe("inPeriod", () => {
  it("is inclusive on both ends", () => {
    const p = { start: "2026-09-19", end: "2026-09-25" };
    expect(inPeriod("2026-09-19", p)).toBe(true);
    expect(inPeriod("2026-09-25", p)).toBe(true);
    expect(inPeriod("2026-09-26", p)).toBe(false);
  });
});
