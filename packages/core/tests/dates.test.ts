import {
  addDays,
  dayOfWeek,
  daysBetween,
  monthKey,
  parseIsoDate,
  startOfMonth,
  startOfWeek,
  toIsoDate,
  todayInTimezone,
} from "../src/engines/dates";

describe("dates", () => {
  it("round-trips ISO dates", () => {
    expect(toIsoDate(parseIsoDate("2026-09-23"))).toBe("2026-09-23");
    expect(toIsoDate(parseIsoDate("2024-02-29"))).toBe("2024-02-29");
  });

  it("rejects invalid dates", () => {
    expect(() => parseIsoDate("2026-13-01")).toThrow(RangeError);
    expect(() => parseIsoDate("2025-02-29")).toThrow(RangeError);
    expect(() => parseIsoDate("not-a-date")).toThrow(RangeError);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes day differences", () => {
    expect(daysBetween("2026-09-23", "2026-09-30")).toBe(7);
    expect(daysBetween("2026-09-30", "2026-09-23")).toBe(-7);
    expect(daysBetween("2026-09-23", "2026-09-23")).toBe(0);
  });

  it("computes week starts respecting configured first weekday", () => {
    // 2026-09-23 is a Wednesday
    expect(dayOfWeek("2026-09-23")).toBe(3);
    expect(startOfWeek("2026-09-23", 6)).toBe("2026-09-19"); // Saturday
    expect(startOfWeek("2026-09-23", 1)).toBe("2026-09-21"); // Monday
    expect(startOfWeek("2026-09-19", 6)).toBe("2026-09-19");
  });

  it("derives month keys", () => {
    expect(monthKey("2026-09-23")).toBe("2026-09");
    expect(startOfMonth("2026-09-23")).toBe("2026-09-01");
  });

  it("resolves today in a timezone", () => {
    // 23:30 UTC on the 23rd is already the 24th in Cairo (UTC+3 in Sept 2026 DST)
    const now = new Date("2026-09-23T23:30:00Z");
    expect(todayInTimezone(now, "Africa/Cairo")).toBe("2026-09-24");
    expect(todayInTimezone(now, "UTC")).toBe("2026-09-23");
  });
});
