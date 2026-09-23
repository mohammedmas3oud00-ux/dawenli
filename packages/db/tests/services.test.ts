import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createArea,
  createGoal,
  createHabit,
  createProject,
  createTask,
  deleteHabit,
  deleteTask,
  findProjectByName,
  getEisenhowerMatrix,
  getGoal,
  getHabit,
  getLatestReview,
  getProject,
  getTask,
  getTaskRecommendations,
  getTodayHabitsStatus,
  listAreas,
  listGoals,
  listHabits,
  listProjects,
  listReviews,
  listTasks,
  logHabit,
  updateGoal,
  updateHabit,
  updateProject,
  updateTask,
  upsertReview,
} from "../src/services";
import { createTestDatabase, type TestDatabase } from "./helpers/pglite";

let t: TestDatabase;
let userId: string;

beforeAll(async () => {
  t = await createTestDatabase();
  userId = await t.createUser("engineer@bawsala.life");
}, 30000);

afterAll(() => t.close());

describe("Tasks Service", () => {
  it("creates a task, derives priority and quadrant, and lists tasks", async () => {
    const today = "2026-09-23";
    const created = await createTask(t.db, userId, today, {
      title: "Fix high-priority bug",
      importance: 5,
      impact: 4,
      difficulty: 2,
      energy: "high",
      dueDate: "2026-09-23", // Due today -> urgency 5
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe("Fix high-priority bug");
    expect(created.importance).toBe(5);
    expect(created.urgency).toBe(5);
    expect(created.eisenhower).toBe("q1"); // Important (5) + Urgent (5)
    expect(created.priorityScore).toBeDefined();

    const tasks = await listTasks(t.db, userId, today, { view: "all" });
    expect(tasks.some((task) => task.id === created.id)).toBe(true);

    const taskWithSubtasks = await getTask(t.db, userId, created.id);
    expect(taskWithSubtasks.id).toBe(created.id);
    expect(taskWithSubtasks.subtasks).toEqual([]);
  });

  it("updates task status to done and sets completedAt", async () => {
    const today = "2026-09-23";
    const task = await createTask(t.db, userId, today, {
      title: "Write integration tests",
      importance: 4,
    });

    const updated = await updateTask(t.db, userId, today, task.id, {
      status: "done",
    });

    expect(updated.status).toBe("done");
    expect(updated.completedAt).not.toBeNull();
  });

  it("groups active tasks into Eisenhower matrix quadrants", async () => {
    const today = "2026-09-23";
    await createTask(t.db, userId, today, {
      title: "Q1 Critical Issue",
      importance: 5,
      urgency: 5,
    });
    await createTask(t.db, userId, today, {
      title: "Q2 Strategic Goal",
      importance: 5,
      urgency: 2,
    });

    const matrix = await getEisenhowerMatrix(t.db, userId, today);
    expect(matrix.q1.some((t) => t.title === "Q1 Critical Issue")).toBe(true);
    expect(matrix.q2.some((t) => t.title === "Q2 Strategic Goal")).toBe(true);
  });

  it("recommends the best task to do now", async () => {
    const today = "2026-09-23";
    const recs = await getTaskRecommendations(t.db, userId, today, { limit: 3 });
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]!.priority.score).toBeGreaterThanOrEqual(recs[recs.length - 1]!.priority.score);
  });

  it("soft-deletes a task", async () => {
    const today = "2026-09-23";
    const task = await createTask(t.db, userId, today, {
      title: "Temporary task",
    });

    await deleteTask(t.db, userId, task.id);
    await expect(getTask(t.db, userId, task.id)).rejects.toThrow();
  });
});

describe("Habits Service", () => {
  it("creates a habit and tracks streaks", async () => {
    const habit = await createHabit(t.db, userId, {
      name: "Morning Reading",
      frequency: "daily",
      targetCount: 1,
    });

    expect(habit.id).toBeDefined();
    expect(habit.name).toBe("Morning Reading");

    const today = "2026-09-23";
    const logResult = await logHabit(t.db, userId, habit.id, today, {
      date: today,
      value: 1,
    });

    expect(logResult.log.completed).toBe(true);
    expect(logResult.currentStreak).toBe(1);

    const reloaded = await getHabit(t.db, userId, habit.id);
    expect(reloaded.currentStreak).toBe(1);
  });

  it("handles Islamic prayers preset and computes prayer count", async () => {
    const habit = await createHabit(t.db, userId, {
      name: "Daily Prayers",
      frequency: "daily",
      targetCount: 5,
      preset: "prayers",
    });

    const today = "2026-09-23";
    const logResult = await logHabit(t.db, userId, habit.id, today, {
      date: today,
      value: 0,
      metadata: {
        fajr: "jamaah",
        dhuhr: "on_time",
        asr: "on_time",
        maghrib: "jamaah",
        isha: "late",
      },
    });

    // All 5 prayers performed
    expect(Number(logResult.log.value)).toBe(5);
    expect(logResult.log.completed).toBe(true);
  });

  it("returns today status for active habits", async () => {
    const today = "2026-09-23";
    const statuses = await getTodayHabitsStatus(t.db, userId, today);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((s) => typeof s.loggedToday === "boolean")).toBe(true);
  });
});

describe("Reviews Service", () => {
  it("upserts and queries daily reviews", async () => {
    const review = await upsertReview(t.db, userId, {
      type: "daily",
      periodStart: "2026-09-23",
      periodEnd: "2026-09-23",
      mood: 4,
      energy: 5,
      wins: ["Completed Core Database Services", "100% Green Tests"],
      failures: [],
      lessons: ["Iterative test-driven development ensures rock-solid quality"],
      complete: true,
    });

    expect(review.id).toBeDefined();
    expect(review.mood).toBe(4);
    expect(review.energy).toBe(5);
    expect(review.wins).toHaveLength(2);

    const latest = await getLatestReview(t.db, userId, "daily");
    expect(latest?.id).toBe(review.id);

    const allDaily = await listReviews(t.db, userId, { type: "daily" });
    expect(allDaily.some((r) => r.id === review.id)).toBe(true);
  });
});

describe("Areas, Goals, and Projects Services", () => {
  it("creates areas, goals, and projects and links them with progress rollup", async () => {
    const today = "2026-09-23";

    // 1. Create an Area
    const area = await createArea(t.db, userId, {
      name: "Health & Fitness",
      icon: "activity",
      color: "#10b981",
    });
    expect(area.id).toBeDefined();
    expect(area.name).toBe("Health & Fitness");

    const areas = await listAreas(t.db, userId);
    expect(areas.some((a) => a.id === area.id)).toBe(true);

    // 2. Create a Goal
    const goal = await createGoal(t.db, userId, {
      title: "Run 10km Marathon",
      horizon: "annual",
      priority: 4,
      areaId: area.id,
    });
    expect(goal.id).toBeDefined();
    expect(goal.title).toBe("Run 10km Marathon");

    const fetchedGoal = await getGoal(t.db, userId, goal.id);
    expect(fetchedGoal.id).toBe(goal.id);

    const updatedGoal = await updateGoal(t.db, userId, goal.id, {
      priority: 5,
    });
    expect(updatedGoal.priority).toBe(5);

    // 3. Create a Project linked to Goal
    const project = await createProject(t.db, userId, {
      title: "Marathon Training Program",
      goalId: goal.id,
      areaId: area.id,
      status: "active",
      weight: 1,
    });
    expect(project.id).toBeDefined();
    expect(project.title).toBe("Marathon Training Program");

    const fetchedProject = await getProject(t.db, userId, project.id, today);
    expect(fetchedProject?.id).toBe(project.id);
    expect(fetchedProject?.progress).toBeDefined();

    // 4. Test findProjectByName
    const foundProject = await findProjectByName(t.db, userId, "marathon training program");
    expect(foundProject?.id).toBe(project.id);

    // 5. Update Project
    const updatedProject = await updateProject(t.db, userId, project.id, {
      status: "completed",
    });
    expect(updatedProject.status).toBe("completed");

    // 6. List Goals and Projects
    const goalsList = await listGoals(t.db, userId, { horizon: "annual" });
    expect(goalsList.some((g) => g.id === goal.id)).toBe(true);

    const projectsList = await listProjects(t.db, userId, today);
    expect(projectsList.some((p) => p.id === project.id)).toBe(true);
  });
});

