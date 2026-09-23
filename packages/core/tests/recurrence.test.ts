import {
  formatRRule,
  nextOccurrence,
  nextOccurrenceFromRule,
  parseRRule,
} from "../src/engines/recurrence";

describe("parseRRule", () => {
  it("parses frequency, interval, byday, count and until", () => {
    expect(parseRRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=10;UNTIL=20261231")).toEqual({
      freq: "WEEKLY",
      interval: 2,
      byDay: [1, 3],
      count: 10,
      until: "2026-12-31",
    });
  });

  it("accepts an RRULE: prefix and lower-case input", () => {
    expect(parseRRule("rrule:freq=daily")).toEqual({ freq: "DAILY", interval: 1 });
  });

  it("dedupes and sorts BYDAY", () => {
    expect(parseRRule("FREQ=WEEKLY;BYDAY=FR,MO,FR")?.byDay).toEqual([1, 5]);
  });

  it("ignores unknown parts but rejects malformed ones", () => {
    expect(parseRRule("FREQ=DAILY;WKST=MO")).toEqual({ freq: "DAILY", interval: 1 });
    expect(parseRRule("FREQ=HOURLY")).toBeNull();
    expect(parseRRule("INTERVAL=2")).toBeNull();
    expect(parseRRule("FREQ=DAILY;INTERVAL=0")).toBeNull();
    expect(parseRRule("FREQ=DAILY;BYDAY=XX")).toBeNull();
    expect(parseRRule("FREQ=DAILY;UNTIL=2026-12-31")).toBeNull();
    expect(parseRRule("FREQ=DAILY;COUNT=abc")).toBeNull();
    expect(parseRRule("")).toBeNull();
    expect(parseRRule("FREQ")).toBeNull();
  });
});

describe("formatRRule", () => {
  it("round-trips through parseRRule", () => {
    const rules = [
      "FREQ=DAILY",
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,TU",
      "FREQ=MONTHLY;COUNT=3",
      "FREQ=YEARLY;UNTIL=20301231",
    ];
    for (const rule of rules) expect(formatRRule(parseRRule(rule)!)).toBe(rule);
  });
});

describe("nextOccurrence", () => {
  it("daily with interval", () => {
    expect(nextOccurrence({ freq: "DAILY", interval: 1 }, "2026-09-23")).toBe("2026-09-24");
    expect(nextOccurrence({ freq: "DAILY", interval: 3 }, "2026-09-30")).toBe("2026-10-03");
  });

  it("weekly without BYDAY jumps whole weeks", () => {
    expect(nextOccurrence({ freq: "WEEKLY", interval: 2 }, "2026-09-23")).toBe("2026-10-07");
  });

  it("weekly with BYDAY picks the next listed weekday", () => {
    // 2026-09-23 is a Wednesday
    const rule = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR")!;
    expect(nextOccurrence(rule, "2026-09-23")).toBe("2026-09-25"); // Friday
    expect(nextOccurrence(rule, "2026-09-25")).toBe("2026-09-28"); // Monday next week
  });

  it("weekly BYDAY with interval skips weeks after the last listed day", () => {
    const rule = parseRRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO")!;
    expect(nextOccurrence(rule, "2026-09-21")).toBe("2026-10-05");
  });

  it("monthly clamps to the end of shorter months", () => {
    expect(nextOccurrence({ freq: "MONTHLY", interval: 1 }, "2026-01-31")).toBe("2026-02-28");
    expect(nextOccurrence({ freq: "MONTHLY", interval: 1 }, "2026-03-31")).toBe("2026-04-30");
  });

  it("yearly handles leap days", () => {
    expect(nextOccurrence({ freq: "YEARLY", interval: 1 }, "2028-02-29")).toBe("2029-02-28");
  });

  it("stops at COUNT and UNTIL", () => {
    expect(nextOccurrence({ freq: "DAILY", interval: 1, count: 3 }, "2026-09-23", 3)).toBeNull();
    expect(nextOccurrence({ freq: "DAILY", interval: 1, count: 3 }, "2026-09-23", 2)).toBe(
      "2026-09-24",
    );
    expect(
      nextOccurrence({ freq: "DAILY", interval: 1, until: "2026-09-23" }, "2026-09-23"),
    ).toBeNull();
    expect(nextOccurrence({ freq: "DAILY", interval: 1, until: "2026-09-24" }, "2026-09-23")).toBe(
      "2026-09-24",
    );
  });
});

describe("nextOccurrenceFromRule", () => {
  it("returns null for empty or invalid rules", () => {
    expect(nextOccurrenceFromRule(null, "2026-09-23")).toBeNull();
    expect(nextOccurrenceFromRule("", "2026-09-23")).toBeNull();
    expect(nextOccurrenceFromRule("FREQ=NOPE", "2026-09-23")).toBeNull();
  });

  it("delegates to nextOccurrence", () => {
    expect(nextOccurrenceFromRule("FREQ=DAILY", "2026-09-23")).toBe("2026-09-24");
  });
});
