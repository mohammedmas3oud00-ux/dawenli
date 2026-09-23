import {
  completionRate,
  computeStreak,
  periodKey,
  type HabitLogForStreak,
} from "../src/engines/streaks";

const ctx = { today: "2026-09-23", weekStartsOn: 6 }; // Wednesday, weeks start Saturday

const log = (date: string, completed = true): HabitLogForStreak => ({ logDate: date, completed });

describe("periodKey", () => {
  it("maps dates to periods", () => {
    expect(periodKey("2026-09-23", { frequency: "daily" }, ctx)).toBe("2026-09-23");
    expect(periodKey("2026-09-23", { frequency: "weekly" }, ctx)).toBe("2026-09-19");
    expect(periodKey("2026-09-23", { frequency: "monthly" }, ctx)).toBe("2026-09");
  });
});

describe("computeStreak — daily", () => {
  const habit = { frequency: "daily" as const };

  it("is zero with no logs", () => {
    expect(computeStreak([], habit, ctx)).toEqual({ current: 0, longest: 0 });
  });

  it("counts consecutive days including today", () => {
    const logs = [log("2026-09-21"), log("2026-09-22"), log("2026-09-23")];
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 3, longest: 3 });
  });

  it("does not break the streak when today is not logged yet", () => {
    const logs = [log("2026-09-21"), log("2026-09-22")];
    expect(computeStreak(logs, habit, ctx).current).toBe(2);
  });

  it("breaks after a missed day and tracks the longest run separately", () => {
    const logs = [
      log("2026-09-15"),
      log("2026-09-16"),
      log("2026-09-17"),
      log("2026-09-18"),
      // 19th missed
      log("2026-09-20"),
      log("2026-09-21"),
      log("2026-09-23"),
    ];
    // 22nd missed → current streak is just today
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 1, longest: 4 });
  });

  it("ignores incomplete logs", () => {
    const logs = [log("2026-09-22", false), log("2026-09-23")];
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 1, longest: 1 });
  });

  it("skips non-scheduled weekdays instead of breaking", () => {
    // Only Mon(1) / Wed(3). 21st = Mon, 23rd = Wed, 16th = Wed, 14th = Mon.
    const weekdays = { frequency: "daily" as const, daysOfWeek: [1, 3] };
    const logs = [log("2026-09-14"), log("2026-09-16"), log("2026-09-21"), log("2026-09-23")];
    expect(computeStreak(logs, weekdays, ctx)).toEqual({ current: 4, longest: 4 });
  });

  it("de-duplicates multiple logs on the same day", () => {
    const logs = [log("2026-09-23"), log("2026-09-23"), log("2026-09-22")];
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 2, longest: 2 });
  });
});

describe("computeStreak — weekly", () => {
  it("requires targetCount completions per week", () => {
    const habit = { frequency: "weekly" as const, targetCount: 2 };
    const logs = [
      // week of 09-05: 2 completions ✔
      log("2026-09-06"),
      log("2026-09-08"),
      // week of 09-12: 1 completion ✘
      log("2026-09-13"),
      // week of 09-19 (current): 2 completions ✔
      log("2026-09-20"),
      log("2026-09-22"),
    ];
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 1, longest: 1 });
  });

  it("counts consecutive satisfied weeks", () => {
    const habit = { frequency: "weekly" as const, targetCount: 1 };
    const logs = [log("2026-09-06"), log("2026-09-13"), log("2026-09-20")];
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 3, longest: 3 });
  });

  it("keeps the streak alive while the current week is still open", () => {
    const habit = { frequency: "weekly" as const, targetCount: 1 };
    const logs = [log("2026-09-06"), log("2026-09-13")];
    expect(computeStreak(logs, habit, ctx).current).toBe(2);
  });
});

describe("computeStreak — monthly", () => {
  it("handles year boundaries", () => {
    const habit = { frequency: "monthly" as const, targetCount: 1 };
    const janCtx = { today: "2027-01-10", weekStartsOn: 6 };
    const logs = [log("2026-11-05"), log("2026-12-20"), log("2027-01-02")];
    expect(computeStreak(logs, habit, janCtx)).toEqual({ current: 3, longest: 3 });
  });

  it("breaks on a skipped month", () => {
    const habit = { frequency: "monthly" as const };
    const logs = [log("2026-06-01"), log("2026-07-01"), log("2026-09-01")];
    expect(computeStreak(logs, habit, ctx)).toEqual({ current: 1, longest: 2 });
  });
});

describe("completionRate", () => {
  it("computes the share of satisfied days in the window", () => {
    const habit = { frequency: "daily" as const };
    const logs = [log("2026-09-23"), log("2026-09-22"), log("2026-09-20")];
    // window 09-17..09-23 = 7 days, 3 met
    expect(completionRate(logs, habit, ctx, 7)).toBe(43);
  });

  it("only counts scheduled weekdays", () => {
    const habit = { frequency: "daily" as const, daysOfWeek: [3] }; // Wednesdays only
    const logs = [log("2026-09-23")];
    // window of 14 days contains Wed 16th and Wed 23rd
    expect(completionRate(logs, habit, ctx, 14)).toBe(50);
  });

  it("returns 0 for an empty window", () => {
    expect(completionRate([], { frequency: "daily" }, ctx, 0)).toBe(0);
  });
});
