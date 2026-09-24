import {
  createGoalSchema,
  createHabitSchema,
  createTaskSchema,
  logHabitSchema,
  recommendationsQuerySchema,
  templateFieldSchema,
  upsertReviewSchema,
} from "../src/schemas";
import { AppError } from "../src/errors";

describe("task schema", () => {
  it("applies defaults", () => {
    const task = createTaskSchema.parse({ title: "  Write tests " });
    expect(task.title).toBe("Write tests");
    expect(task.status).toBe("todo");
    expect(task.importance).toBe(3);
    expect(task.energy).toBe("medium");
  });

  it("rejects empty titles and out-of-range ratings", () => {
    expect(createTaskSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "x", importance: 6 }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "x", dueDate: "23/09/2026" }).success).toBe(false);
  });

  it("accepts due times", () => {
    expect(createTaskSchema.safeParse({ title: "x", dueTime: "09:30" }).success).toBe(true);
    expect(createTaskSchema.safeParse({ title: "x", dueTime: "9:30" }).success).toBe(false);
  });
});

describe("goal schema", () => {
  it("requires a horizon and validates period ordering", () => {
    expect(createGoalSchema.safeParse({ title: "x" }).success).toBe(false);
    expect(
      createGoalSchema.safeParse({
        title: "x",
        horizon: "annual",
        periodStart: "2026-12-31",
        periodEnd: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(
      createGoalSchema.safeParse({
        title: "x",
        horizon: "annual",
        periodStart: "2026-01-01",
        periodEnd: "2026-12-31",
      }).success,
    ).toBe(true);
  });
});

describe("habit schemas", () => {
  it("validates days of week", () => {
    expect(
      createHabitSchema.safeParse({ name: "Quran", frequency: "daily", daysOfWeek: [7] }).success,
    ).toBe(false);
    expect(
      createHabitSchema.safeParse({ name: "Quran", frequency: "daily", daysOfWeek: [0, 6] })
        .success,
    ).toBe(true);
  });

  it("accepts prayer metadata on logs", () => {
    const parsed = logHabitSchema.parse({
      date: "2026-09-23",
      metadata: { fajr: "on_time", dhuhr: "late" },
    });
    expect(parsed.value).toBe(1);
    expect(parsed.metadata?.fajr).toBe("on_time");
  });
});

describe("review / template schemas", () => {
  it("enforces snake_case field keys", () => {
    expect(
      templateFieldSchema.safeParse({ key: "TopWin", labelAr: "أ", labelEn: "a", type: "text" })
        .success,
    ).toBe(false);
    expect(
      templateFieldSchema.safeParse({ key: "top_win", labelAr: "أ", labelEn: "a", type: "text" })
        .success,
    ).toBe(true);
  });

  it("defaults review collections", () => {
    const review = upsertReviewSchema.parse({
      type: "daily",
      periodStart: "2026-09-23",
      periodEnd: "2026-09-23",
    });
    expect(review.wins).toEqual([]);
    expect(review.answers).toEqual({});
    expect(review.complete).toBe(false);
  });
});

describe("query schemas coerce strings", () => {
  it("coerces numeric query params", () => {
    const q = recommendationsQuerySchema.parse({ availableMinutes: "30", limit: "3" });
    expect(q.availableMinutes).toBe(30);
    expect(q.limit).toBe(3);
  });
});

describe("AppError", () => {
  it("carries a status and serialises to the API error envelope", () => {
    const err = new AppError("NOT_FOUND", "Task not found", { id: "1" });
    expect(err.status).toBe(404);
    expect(err.toJSON()).toEqual({
      error: { code: "NOT_FOUND", message: "Task not found", details: { id: "1" } },
    });
    expect(new AppError("INTERNAL").message).toBe("INTERNAL");
  });
});
