import { parseDuration, parseQuickAdd, resolveDateToken } from "../src/engines/quick-add";

const TODAY = "2026-09-23"; // Wednesday

describe("resolveDateToken", () => {
  it("handles today / tomorrow", () => {
    expect(resolveDateToken("today", TODAY)).toBe("2026-09-23");
    expect(resolveDateToken("Tomorrow", TODAY)).toBe("2026-09-24");
  });

  it("resolves weekday names to the next matching day (today counts)", () => {
    expect(resolveDateToken("wed", TODAY)).toBe("2026-09-23");
    expect(resolveDateToken("fri", TODAY)).toBe("2026-09-25");
    expect(resolveDateToken("tue", TODAY)).toBe("2026-09-29");
  });

  it("accepts ISO dates and rejects garbage", () => {
    expect(resolveDateToken("2026-10-01", TODAY)).toBe("2026-10-01");
    expect(resolveDateToken("2026-13-01", TODAY)).toBeNull();
    expect(resolveDateToken("someday", TODAY)).toBeNull();
  });
});

describe("parseDuration", () => {
  it("parses minutes, hours and mixed", () => {
    expect(parseDuration("45m")).toBe(45);
    expect(parseDuration("2h")).toBe(120);
    expect(parseDuration("1h30m")).toBe(90);
    expect(parseDuration("90")).toBe(90);
  });

  it("rejects zero and malformed values", () => {
    expect(parseDuration("0m")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("")).toBeNull();
  });
});

describe("parseQuickAdd", () => {
  it("extracts every token kind and leaves the title clean", () => {
    const result = parseQuickAdd("Write thesis intro #Thesis !p1 @tomorrow ~45m ^high", TODAY);
    expect(result).toEqual({
      title: "Write thesis intro",
      projectName: "Thesis",
      importance: 5,
      scheduledDate: "2026-09-24",
      estimateMinutes: 45,
      energy: "high",
    });
  });

  it("maps p1..p5 to importance 5..1", () => {
    expect(parseQuickAdd("x !p1", TODAY).importance).toBe(5);
    expect(parseQuickAdd("x !p3", TODAY).importance).toBe(3);
    expect(parseQuickAdd("x !p5", TODAY).importance).toBe(1);
  });

  it("keeps unrecognised sigil tokens in the title", () => {
    const result = parseQuickAdd("Email @someone about !urgent stuff ~soon", TODAY);
    expect(result.title).toBe("Email @someone about !urgent stuff ~soon");
    expect(result.scheduledDate).toBeUndefined();
    expect(result.importance).toBeUndefined();
    expect(result.estimateMinutes).toBeUndefined();
  });

  it("only honours the first occurrence of each token", () => {
    const result = parseQuickAdd("a #one #two !p2 !p4", TODAY);
    expect(result.projectName).toBe("one");
    expect(result.importance).toBe(4);
    expect(result.title).toBe("a #two !p4");
  });

  it("supports Arabic titles and trims whitespace", () => {
    const result = parseQuickAdd("  كتابة المقدمة   #الرسالة @fri  ", TODAY);
    expect(result.title).toBe("كتابة المقدمة");
    expect(result.projectName).toBe("الرسالة");
    expect(result.scheduledDate).toBe("2026-09-25");
  });

  it("returns an empty title when only tokens are given", () => {
    expect(parseQuickAdd("#p !p1", TODAY).title).toBe("");
  });
});
