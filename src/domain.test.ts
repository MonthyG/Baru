import { describe, expect, it } from "vitest";
import { seed, catalog } from "./seed";
import { dataSchema, equipment, type Workout } from "./model";
import {
  addDays,
  completedSets,
  dayKey,
  displayWeight,
  e1rm,
  lastSets,
  newRecords,
  personalizedRoutine,
  records,
  startWorkout,
  toKg,
  volume,
  weeklyStreak,
  weekStart,
} from "./domain";
const fixture = (): Workout => ({
  id: "test",
  routineId: "push",
  name: "Test session",
  startedAt: "2026-09-20T10:00:00.000Z",
  endedAt: "2026-09-20T11:00:00.000Z",
  restUntil: null,
  restDuration: 0,
  notes: "",
  items: [
    {
      id: "item",
      exerciseId: "barbell-bench-press",
      rest: 90,
      superset: "",
      sets: [
        { id: "one", weight: 100, reps: 5, done: true, type: "normal" },
        { id: "two", weight: 200, reps: 10, done: false, type: "normal" },
        { id: "three", weight: 40, reps: 10, done: true, type: "warmup" },
      ],
    },
  ],
});
describe("training calculations", () => {
  it("only counts completed sets in volume while including warmups", () => {
    expect(volume(fixture())).toBe(900);
    expect(completedSets(fixture())).toBe(2);
  });
  it("excludes warmups and incomplete sets from records", () => {
    const r = records([fixture()], "barbell-bench-press");
    expect(r.weight).toBe(100);
    expect(r.volume).toBe(500);
    expect(r.e1rm).toBeCloseTo(116.6667, 3);
  });
  it("uses the true weight for single rep sets", () => {
    expect(e1rm({ ...fixture().items[0].sets[0], reps: 1 })).toBe(100);
  });
  it("converts imperial input without changing canonical metric weight", () => {
    expect(toKg(220.46226218, "lb")).toBeCloseTo(100, 7);
    expect(displayWeight(100, "lb")).toBe(220.5);
    expect(displayWeight(100, "kg")).toBe(100);
  });
  it("identifies only newly broken records and recalculates after deletion", () => {
    const before = fixture();
    const after = structuredClone(before);
    after.id = "new";
    after.items[0].sets[0].weight = 105;
    const prs = newRecords(after, [before], catalog);
    expect(prs.map((p) => p.kind)).toEqual(["weight", "e1rm", "volume"]);
    expect(newRecords(before, [after], catalog)).toHaveLength(0);
    expect(records([before], "barbell-bench-press").weight).toBe(100);
  });
  it("resolves the last same-index set by timestamp, not storage order", () => {
    const first = fixture();
    const later = structuredClone(first);
    later.startedAt = "2026-09-21T10:00:00.000Z";
    later.items[0].sets[0].weight = 110;
    expect(lastSets([later, first], "barbell-bench-press")[0].weight).toBe(110);
  });
  it("initializes a session with the exact prior numbers and unchecked sets", () => {
    const d = seed();
    const w = startWorkout(d.routines[0], d.workouts);
    const last = lastSets(d.workouts, w.items[0].exerciseId);
    expect(w.items[0].sets[0].weight).toBe(last[0].weight);
    expect(w.items[0].sets[0].reps).toBe(last[0].reps);
    expect(completedSets(w)).toBe(0);
    expect(w.items[3].superset).toBe("A");
  });
  it("counts consecutive active weeks and allows the current week to begin", () => {
    const now = new Date(2026, 8, 21, 12);
    const monday = weekStart(now);
    const sessions = [1, 2, 3].map((n) => ({
      ...fixture(),
      startedAt: addDays(monday, -7 * n).toISOString(),
    }));
    expect(weeklyStreak(sessions, now)).toBe(3);
    expect(weeklyStreak([sessions[0], sessions[2]], now)).toBe(1);
    expect(weeklyStreak([], now)).toBe(0);
  });
});
describe("personalized plans and catalog", () => {
  it("contains at least 80 real, uniquely identified exercises", () => {
    expect(catalog.length).toBeGreaterThanOrEqual(80);
    expect(new Set(catalog.map((e) => e.id)).size).toBe(catalog.length);
    expect(catalog.every((e) => e.cue.length > 20)).toBe(true);
  });
  it.each(equipment)(
    "creates a usable routine with only %s available",
    (gear) => {
      const d = seed();
      const profile = { ...d.profile, name: "Sam", equipment: [gear] };
      const plan = personalizedRoutine(profile, d.exercises);
      expect(plan.items.length).toBeGreaterThan(0);
      expect(
        plan.items.every(
          (i) =>
            d.exercises.find((e) => e.id === i.exerciseId)?.equipment === gear,
        ),
      ).toBe(true);
    },
  );
  it("adapts volume, goal, days, and experience", () => {
    const d = seed();
    const beginner = personalizedRoutine(
      { ...d.profile, experience: "Beginner", goal: "Muscle", days: 2 },
      d.exercises,
    );
    const advanced = personalizedRoutine(
      { ...d.profile, experience: "Advanced", goal: "Strength", days: 5 },
      d.exercises,
    );
    expect(beginner.items[0].sets).toBe(2);
    expect(advanced.items[0].sets).toBe(4);
    expect(advanced.items[0].minReps).toBe(5);
    expect(beginner.items[0].minReps).toBe(8);
    expect(advanced.description).toContain("5 days");
  });
});
describe("safe backups", () => {
  it("accepts a serialized full backup and preserves an active rest timer", () => {
    const d = seed();
    d.active = startWorkout(d.routines[0], d.workouts);
    d.active.items[0].sets[0].done = true;
    d.active.restUntil = Date.now() + 90000;
    d.active.restDuration = 90;
    expect(dataSchema.parse(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("rejects malformed records, negative weights, and unsupported versions", () => {
    for (const mutate of [
      (d: ReturnType<typeof seed>) => (d.version = 2 as 1),
      (d: ReturnType<typeof seed>) =>
        (d.workouts[0].items[0].sets[0].weight = -1),
      (d: ReturnType<typeof seed>) => (d.profile.days = 10),
    ]) {
      const d = seed();
      mutate(d);
      expect(dataSchema.safeParse(d).success).toBe(false);
    }
  });
  it("rejects broken exercise references and duplicate identifiers", () => {
    const d = seed();
    d.routines[0].items[0].exerciseId = "missing";
    expect(dataSchema.safeParse(d).success).toBe(false);
    const duplicate = seed();
    duplicate.exercises.push(duplicate.exercises[0]);
    expect(dataSchema.safeParse(duplicate).success).toBe(false);
  });
  it("rejects invalid dates and completed sets without reps", () => {
    const d = seed();
    d.measurements[0].date = "2026-02-31";
    expect(dataSchema.safeParse(d).success).toBe(false);
    const bad = seed();
    bad.workouts[0].items[0].sets[0].reps = 0;
    expect(dataSchema.safeParse(bad).success).toBe(false);
  });
  it("uses local calendar dates without UTC date drift", () => {
    expect(dayKey(new Date(2026, 0, 1, 0, 15))).toBe("2026-01-01");
  });
});
