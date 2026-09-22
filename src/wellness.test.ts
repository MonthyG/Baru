import { describe, expect, it } from "vitest";
import { freshData } from "./fresh";
import {
  bmi,
  bmiCategory,
  foodTotals,
  reminderDue,
  targetStatus,
} from "./wellness";
import {
  dataSchema,
  foodSchema,
  goalsSchema,
  reminderSchema,
  type Food,
} from "./model";
import { dayKey, toKg } from "./domain";
describe("clean customer start", () => {
  it("starts with no personal activity or targets", () => {
    const d = freshData();
    expect(d.profile.name).toBe("You");
    expect(d.profile.onboarded).toBe(false);
    expect(d.profile.age).toBeNull();
    expect(d.profile.height).toBeNull();
    for (const list of [
      d.workouts,
      d.measurements,
      d.foods,
      d.routines,
      d.favorites,
      d.reminders,
    ])
      expect(list).toHaveLength(0);
    expect(d.goals).toEqual({
      calories: null,
      protein: null,
      weight: null,
      date: null,
    });
    expect(d.exercises.length).toBe(96);
  });
  it("round-trips the expanded backup", () => {
    const d = freshData();
    d.profile.age = 25;
    d.profile.height = 180;
    d.goals = { calories: 2400, protein: 130, weight: 75, date: "2026-12-31" };
    d.foods = [
      {
        id: "food",
        name: "Lunch",
        date: "2026-09-22",
        meal: "Lunch",
        calories: 500,
        protein: 30,
        servings: 1.5,
      },
    ];
    d.reminders = [
      {
        id: "reminder",
        title: "Log food",
        kind: "Food",
        time: "19:00",
        days: [2],
        enabled: true,
        dismissed: null,
        notified: null,
      },
    ];
    expect(dataSchema.parse(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
});
describe("BMI", () => {
  it("calculates kg/m² and agrees after imperial conversion", () => {
    expect(bmi(81, 180)).toBe(25);
    expect(bmi(toKg(178.5744323658, "lb"), 180)).toBeCloseTo(25, 5);
  });
  it("handles empty inputs and exact category boundaries", () => {
    expect(bmi(null, 180)).toBeNull();
    expect(bmi(80, 0)).toBeNull();
    expect(bmiCategory(18.49, 25)).toBe("Underweight");
    expect(bmiCategory(18.5, 25)).toBe("Healthy weight");
    expect(bmiCategory(25, 25)).toBe("Overweight");
    expect(bmiCategory(30, 25)).toBe("Obesity");
  });
  it("does not assign adult categories to teenagers or unknown ages", () => {
    expect(bmiCategory(25, 19)).toBe("Age-specific interpretation needed");
    expect(bmiCategory(25, null)).toBe("Add age for interpretation");
  });
});
describe("food and goals", () => {
  const foods: Food[] = [
    {
      id: "a",
      name: "Breakfast",
      date: "2026-09-22",
      meal: "Breakfast",
      calories: 300,
      protein: 20,
      servings: 1.5,
    },
    {
      id: "b",
      name: "Lunch",
      date: "2026-09-22",
      meal: "Lunch",
      calories: 500,
      protein: 40,
      servings: 1,
    },
    {
      id: "c",
      name: "Yesterday",
      date: "2026-09-21",
      meal: "Dinner",
      calories: 600,
      protein: 50,
      servings: 1,
    },
  ];
  it("sums servings on the selected date only", () =>
    expect(foodTotals(foods, "2026-09-22")).toEqual({
      calories: 950,
      protein: 70,
    }));
  it("recalculates after edits and deletions", () => {
    expect(
      foodTotals(
        foods.filter((f) => f.id !== "a"),
        "2026-09-22",
      ).protein,
    ).toBe(40);
    expect(
      foodTotals(
        foods.map((f) => (f.id === "b" ? { ...f, servings: 2 } : f)),
        "2026-09-22",
      ).calories,
    ).toBe(1450);
  });
  it("distinguishes remaining, reached, and above-target intake", () => {
    expect(targetStatus(70, 100, "g")).toBe("30 g remaining");
    expect(targetStatus(100, 100, "g")).toBe("Target reached");
    expect(targetStatus(110, 100, "g")).toBe("10 g above target");
    expect(targetStatus(0, null, "g")).toBe("Set a daily target");
  });
  it("rejects invalid nutrition, dates, and targets", () => {
    expect(foodSchema.safeParse({ ...foods[0], servings: 0 }).success).toBe(
      false,
    );
    expect(
      foodSchema.safeParse({ ...foods[0], date: "2026-02-31" }).success,
    ).toBe(false);
    expect(foodSchema.safeParse({ ...foods[0], protein: -1 }).success).toBe(
      false,
    );
    expect(goalsSchema.safeParse({ calories: -1 }).success).toBe(false);
  });
});
describe("local reminders", () => {
  const r = reminderSchema.parse({
    id: "r",
    title: "Train",
    kind: "Workout",
    time: "18:00",
    days: [2],
    enabled: true,
  });
  const now = new Date(2026, 8, 22, 18, 0);
  it("triggers on the chosen local day at or after the time", () => {
    expect(reminderDue(r, now)).toBe(true);
    expect(reminderDue(r, new Date(2026, 8, 22, 17, 59))).toBe(false);
    expect(reminderDue(r, new Date(2026, 8, 23, 19))).toBe(false);
  });
  it("respects pause and dismissal and recurs on the next scheduled week", () => {
    expect(reminderDue({ ...r, enabled: false }, now)).toBe(false);
    expect(reminderDue({ ...r, dismissed: dayKey(now) }, now)).toBe(false);
    expect(
      reminderDue({ ...r, dismissed: dayKey(now) }, new Date(2026, 8, 29, 18)),
    ).toBe(true);
  });
  it("rejects an invalid time or empty schedule", () => {
    expect(reminderSchema.safeParse({ ...r, time: "25:00" }).success).toBe(
      false,
    );
    expect(reminderSchema.safeParse({ ...r, days: [] }).success).toBe(false);
  });
});
