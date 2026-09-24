import { DEFAULT_PRIORITY_WEIGHTS } from "../src/constants";
import {
  computePriority,
  deriveEnergyFit,
  deriveGoalContribution,
  deriveUrgency,
  eisenhowerQuadrant,
  recommendTasks,
  type PriorityInput,
} from "../src/engines/priority";

const TODAY = "2026-09-23";

const base: PriorityInput = {
  importance: 3,
  impact: 3,
  difficulty: 3,
  energy: "medium",
};

describe("deriveUrgency", () => {
  it("returns 1 with no due date", () => {
    expect(deriveUrgency(null, TODAY)).toBe(1);
    expect(deriveUrgency(undefined, TODAY)).toBe(1);
  });

  it("maps due-date distance to buckets", () => {
    expect(deriveUrgency("2026-09-20", TODAY)).toBe(5); // overdue
    expect(deriveUrgency("2026-09-23", TODAY)).toBe(5); // today
    expect(deriveUrgency("2026-09-24", TODAY)).toBe(4); // 1 day
    expect(deriveUrgency("2026-09-25", TODAY)).toBe(4); // 2 days
    expect(deriveUrgency("2026-09-26", TODAY)).toBe(3); // 3 days
    expect(deriveUrgency("2026-09-29", TODAY)).toBe(3); // 6 days
    expect(deriveUrgency("2026-09-30", TODAY)).toBe(2); // 7 days
    expect(deriveUrgency("2026-10-22", TODAY)).toBe(2); // 29 days
    expect(deriveUrgency("2026-10-23", TODAY)).toBe(1); // 30 days
  });
});

describe("deriveGoalContribution / deriveEnergyFit", () => {
  it("unlinked tasks contribute 1, linked tasks follow goal priority", () => {
    expect(deriveGoalContribution(null)).toBe(1);
    expect(deriveGoalContribution(5)).toBe(5);
    expect(deriveGoalContribution(9)).toBe(5); // clamped
  });

  it("energy fit is neutral when user energy is unknown and peaks on a match", () => {
    expect(deriveEnergyFit("high", null)).toBe(3);
    expect(deriveEnergyFit("medium", 3)).toBe(5);
    expect(deriveEnergyFit("high", 4)).toBe(5);
    expect(deriveEnergyFit("high", 1)).toBe(1); // distance 3 → 5 - 4.5 → floor 1
    expect(deriveEnergyFit("low", 3)).toBe(3.5);
  });
});

describe("eisenhowerQuadrant", () => {
  it("classifies by importance/urgency thresholds", () => {
    expect(eisenhowerQuadrant(5, 5)).toBe("q1");
    expect(eisenhowerQuadrant(4, 2)).toBe("q2");
    expect(eisenhowerQuadrant(2, 4)).toBe("q3");
    expect(eisenhowerQuadrant(3, 3)).toBe("q4");
  });
});

describe("computePriority", () => {
  it("weights sum to 1 so a maximal task scores 5", () => {
    const sum = Object.values(DEFAULT_PRIORITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);

    const result = computePriority(
      {
        importance: 5,
        impact: 5,
        difficulty: 1,
        energy: "medium",
        dueDate: TODAY,
        goalPriority: 5,
      },
      { today: TODAY, userEnergy: 3 },
    );
    expect(result.score).toBe(5);
    expect(result.quadrant).toBe("q1");
  });

  it("a minimal task scores near the floor", () => {
    const result = computePriority(
      { importance: 1, impact: 1, difficulty: 5, energy: "high", goalPriority: null },
      { today: TODAY, userEnergy: 1 },
    );
    // 1*.25 + 1*.2 + 1*.2 + 1*.2 + 1*.05 + 1*.1 = 1
    expect(result.score).toBe(1);
    expect(result.quadrant).toBe("q4");
  });

  it("explicit urgency overrides due-date derivation", () => {
    const derived = computePriority({ ...base, dueDate: TODAY }, { today: TODAY });
    const explicit = computePriority({ ...base, dueDate: TODAY, urgency: 1 }, { today: TODAY });
    expect(derived.urgency).toBe(5);
    expect(explicit.urgency).toBe(1);
    expect(explicit.score).toBeLessThan(derived.score);
  });

  it("supports custom weights", () => {
    const onlyImportance = {
      importance: 1,
      urgency: 0,
      impact: 0,
      goalContribution: 0,
      ease: 0,
      energyFit: 0,
    };
    const result = computePriority(
      { ...base, importance: 4 },
      { today: TODAY, weights: onlyImportance },
    );
    expect(result.score).toBe(4);
  });

  it("clamps out-of-range ratings instead of producing garbage", () => {
    const result = computePriority(
      { importance: 99, impact: -3, difficulty: 0, energy: "low" },
      { today: TODAY },
    );
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(5);
  });
});

describe("recommendTasks", () => {
  const tasks = [
    { id: "a", ...base, importance: 5, dueDate: TODAY, estimateMinutes: 90 },
    { id: "b", ...base, importance: 4, estimateMinutes: 15 },
    { id: "c", ...base, importance: 2, estimateMinutes: null },
    { id: "d", ...base, importance: 4, estimateMinutes: 10 },
  ];

  it("ranks by score descending", () => {
    const ranked = recommendTasks(tasks, { today: TODAY });
    expect(ranked.map((r) => r.task.id)).toEqual(["a", "d", "b", "c"]);
  });

  it("filters by available time and keeps unestimated tasks", () => {
    const ranked = recommendTasks(tasks, { today: TODAY }, { availableMinutes: 20 });
    expect(ranked.map((r) => r.task.id)).toEqual(["d", "b", "c"]);
  });

  it("breaks ties by shorter estimate", () => {
    const ranked = recommendTasks(tasks, { today: TODAY }, { limit: 3 });
    const [, second, third] = ranked;
    expect(second?.task.id).toBe("d");
    expect(third?.task.id).toBe("b");
  });

  it("respects the limit", () => {
    expect(recommendTasks(tasks, { today: TODAY }, { limit: 2 })).toHaveLength(2);
  });
});
