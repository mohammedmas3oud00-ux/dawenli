import {
  computeGoalProgress,
  computeProjectProgress,
  computeVisionProgress,
  taskImpactOnProject,
  type TaskForProgress,
} from "../src/engines/progress";

describe("computeProjectProgress", () => {
  it("returns zero for an empty project", () => {
    expect(computeProjectProgress([])).toEqual({ progress: 0, totalTasks: 0, doneTasks: 0 });
  });

  it("weights tasks by estimate and defaults to 1", () => {
    const tasks: TaskForProgress[] = [
      { status: "done", estimateMinutes: 60 },
      { status: "todo", estimateMinutes: 30 },
      { status: "todo", estimateMinutes: null }, // weight 1
    ];
    const snap = computeProjectProgress(tasks);
    expect(snap.totalTasks).toBe(3);
    expect(snap.doneTasks).toBe(1);
    expect(snap.progress).toBeCloseTo((100 * 60) / 91, 2);
  });

  it("excludes cancelled tasks entirely", () => {
    const snap = computeProjectProgress([
      { status: "done" },
      { status: "cancelled", estimateMinutes: 500 },
    ]);
    expect(snap).toEqual({ progress: 100, totalTasks: 1, doneTasks: 1 });
  });

  it("returns 0 when only cancelled tasks exist", () => {
    expect(computeProjectProgress([{ status: "cancelled" }])).toEqual({
      progress: 0,
      totalTasks: 0,
      doneTasks: 0,
    });
  });
});

describe("computeGoalProgress", () => {
  const p = (progress: number, weight = 1, total = 4, done = 2) => ({
    weight,
    snapshot: { progress, totalTasks: total, doneTasks: done },
  });

  it("is a weighted mean of project progress", () => {
    const snap = computeGoalProgress([p(100, 1), p(0, 3)]);
    expect(snap.progress).toBe(25);
    expect(snap.totalTasks).toBe(8);
    expect(snap.doneTasks).toBe(4);
  });

  it("manual progress overrides and is clamped", () => {
    expect(computeGoalProgress([p(10)], 42.5).progress).toBe(42.5);
    expect(computeGoalProgress([], 150).progress).toBe(100);
    expect(computeGoalProgress([], -5).progress).toBe(0);
  });

  it("handles no projects and no override", () => {
    expect(computeGoalProgress([]).progress).toBe(0);
  });

  it("treats non-positive weights as 1", () => {
    expect(computeGoalProgress([p(100, 0), p(0, -2)]).progress).toBe(50);
  });
});

describe("computeVisionProgress", () => {
  it("averages goals", () => {
    const snap = computeVisionProgress([
      { progress: 20, totalTasks: 2, doneTasks: 1 },
      { progress: 60, totalTasks: 4, doneTasks: 3 },
    ]);
    expect(snap).toEqual({ progress: 40, totalTasks: 6, doneTasks: 4 });
  });

  it("returns zero without goals", () => {
    expect(computeVisionProgress([]).progress).toBe(0);
  });
});

describe("taskImpactOnProject", () => {
  it("reports the percentage points a task adds when completed", () => {
    const a: TaskForProgress = { status: "todo", estimateMinutes: 30 };
    const b: TaskForProgress = { status: "todo", estimateMinutes: 30 };
    const c: TaskForProgress = { status: "done", estimateMinutes: 60 };
    expect(taskImpactOnProject(a, [a, b, c])).toBe(25);
  });

  it("is zero for an already-done task", () => {
    const a: TaskForProgress = { status: "done" };
    expect(taskImpactOnProject(a, [a, { status: "todo" }])).toBe(0);
  });
});
