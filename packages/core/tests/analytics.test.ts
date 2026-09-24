import { habitScore, percent, projectHealth } from "../src/engines/analytics";

const TODAY = "2026-09-23";

describe("projectHealth", () => {
  it("reports completed / inactive from status", () => {
    expect(projectHealth({ status: "completed", progress: 10 }, TODAY)).toBe("completed");
    expect(projectHealth({ status: "on_hold", progress: 10 }, TODAY)).toBe("inactive");
    expect(projectHealth({ status: "backlog", progress: 0 }, TODAY)).toBe("inactive");
  });

  it("treats 100% progress as completed even when still active", () => {
    expect(projectHealth({ status: "active", progress: 100 }, TODAY)).toBe("completed");
  });

  it("is on_track without a due date", () => {
    expect(projectHealth({ status: "active", progress: 0 }, TODAY)).toBe("on_track");
  });

  it("is overdue after the due date", () => {
    expect(projectHealth({ status: "active", progress: 50, dueDate: "2026-09-22" }, TODAY)).toBe(
      "overdue",
    );
  });

  it("flags at_risk when progress lags the timeline by more than 20 points", () => {
    const timeline = { status: "active" as const, startDate: "2026-09-03", dueDate: "2026-10-03" };
    // 20 of 30 days elapsed → expected ≈ 66.7
    expect(projectHealth({ ...timeline, progress: 40 }, TODAY)).toBe("at_risk");
    expect(projectHealth({ ...timeline, progress: 50 }, TODAY)).toBe("on_track");
  });

  it("falls back to on_track when the timeline is degenerate", () => {
    expect(projectHealth({ status: "active", progress: 0, dueDate: "2026-10-03" }, TODAY)).toBe(
      "on_track",
    );
    expect(
      projectHealth(
        { status: "active", progress: 0, startDate: "2026-10-03", dueDate: "2026-10-03" },
        TODAY,
      ),
    ).toBe("on_track");
  });
});

describe("habitScore / percent", () => {
  it("averages rates and rounds", () => {
    expect(habitScore([])).toBe(0);
    expect(habitScore([100, 50, 0])).toBe(50);
    expect(habitScore([33, 34])).toBe(34);
  });

  it("percent never divides by zero", () => {
    expect(percent(1, 0)).toBe(0);
    expect(percent(1, 3)).toBe(33);
    expect(percent(3, 3)).toBe(100);
  });
});
