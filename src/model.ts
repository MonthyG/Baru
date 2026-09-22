import { z } from "zod";
const id = z.string().min(1).max(100);
const name = z.string().trim().min(1).max(100);
export const muscles = [
  "Chest",
  "Back",
  "Shoulders",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Biceps",
  "Triceps",
  "Core",
  "Calves",
  "Forearms",
] as const;
export const equipment = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Kettlebell",
  "Resistance band",
] as const;
const muscle = z.enum(muscles);
export const exerciseSchema = z.object({
  id,
  name,
  muscle,
  secondary: z.array(muscle).max(8),
  equipment: z.enum(equipment),
  cue: z.string().min(1).max(500),
  custom: z.boolean().optional(),
});
export const profileSchema = z.object({
  name,
  units: z.enum(["kg", "lb"]),
  experience: z.enum(["Beginner", "Intermediate", "Advanced"]),
  days: z.number().int().min(1).max(7),
  goal: z.enum(["Strength", "Muscle", "General fitness"]),
  equipment: z.array(z.enum(equipment)).min(1),
  theme: z.enum(["light", "dark", "system"]),
  rest: z.number().int().min(0).max(600),
  onboarded: z.boolean(),
  age: z.number().int().min(13).max(120).nullable().default(null),
  height: z.number().finite().min(100).max(250).nullable().default(null),
});
const routineItemSchema = z.object({
  id,
  exerciseId: id,
  sets: z.number().int().min(1).max(20),
  minReps: z.number().int().min(1).max(100),
  maxReps: z.number().int().min(1).max(100),
  rest: z.number().int().min(0).max(600),
  superset: z.string().max(8),
});
export const routineSchema = z.object({
  id,
  name,
  description: z.string().max(500),
  items: z.array(routineItemSchema).max(50),
});
export const setSchema = z.object({
  id,
  weight: z.number().finite().min(0).max(1500),
  reps: z.number().int().min(0).max(500),
  done: z.boolean(),
  type: z.enum(["normal", "warmup", "failure", "drop"]),
});
const workoutItemSchema = z.object({
  id,
  exerciseId: id,
  sets: z.array(setSchema).max(50),
  rest: z.number().int().min(0).max(600),
  superset: z.string().max(8),
});
export const workoutSchema = z.object({
  id,
  routineId: z.string().max(100),
  name,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  items: z.array(workoutItemSchema).max(50),
  notes: z.string().max(2000),
  restUntil: z.number().finite().nullable(),
  restDuration: z.number().finite().min(0).max(36000),
});
export const measurementSchema = z.object({
  id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().finite().min(20).max(500),
  height: z.number().finite().min(100).max(250).nullable().default(null),
  waist: z.number().finite().min(0).max(300),
  chest: z.number().finite().min(0).max(300),
  hips: z.number().finite().min(0).max(300),
  arm: z.number().finite().min(0).max(150),
});
export const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s,
    "Enter a valid date",
  );
export const foodSchema = z.object({
  id,
  name,
  date: calendarDate,
  meal: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  servings: z.number().finite().positive().max(100),
  calories: z.number().finite().min(0).max(10000),
  protein: z.number().finite().min(0).max(1000),
});
export const goalsSchema = z.object({
  calories: z.number().int().min(100).max(10000).nullable().default(null),
  protein: z.number().finite().min(1).max(1000).nullable().default(null),
  weight: z.number().finite().min(20).max(500).nullable().default(null),
  date: calendarDate.nullable().default(null),
});
export const reminderSchema = z.object({
  id,
  title: name,
  kind: z.enum(["Workout", "Food", "Weigh-in"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  enabled: z.boolean(),
  dismissed: calendarDate.nullable().default(null),
  notified: calendarDate.nullable().default(null),
});
export const dataSchema = z
  .object({
    version: z.literal(1),
    customerLog: z.literal(true).default(true),
    profile: profileSchema,
    exercises: z.array(exerciseSchema).min(1).max(2000),
    favorites: z.array(id).max(2000),
    routines: z.array(routineSchema).max(500),
    workouts: z.array(workoutSchema).max(10000),
    measurements: z.array(measurementSchema).max(10000),
    active: workoutSchema.nullable(),
    foods: z.array(foodSchema).max(30000).default([]),
    goals: goalsSchema.default({
      calories: null,
      protein: null,
      weight: null,
      date: null,
    }),
    reminders: z.array(reminderSchema).max(50).default([]),
  })
  .superRefine((data, ctx) => {
    const ids = new Set(data.exercises.map((e) => e.id));
    const unique = (values: string[]) => values.length === new Set(values).size;
    if (
      ![
        data.exercises,
        data.routines,
        data.workouts,
        data.measurements,
        data.foods,
        data.reminders,
      ].every((a) => unique(a.map((x) => x.id)))
    )
      ctx.addIssue({ code: "custom", message: "Duplicate record IDs" });
    if (
      data.favorites.some((x) => !ids.has(x)) ||
      [
        ...data.routines,
        ...data.workouts,
        ...(data.active ? [data.active] : []),
      ].some((r) => r.items.some((i) => !ids.has(i.exerciseId)))
    )
      ctx.addIssue({
        code: "custom",
        message: "An exercise reference is missing",
      });
    if (data.routines.some((r) => r.items.some((i) => i.minReps > i.maxReps)))
      ctx.addIssue({ code: "custom", message: "Invalid rep range" });
    const sessions = [...data.workouts, ...(data.active ? [data.active] : [])];
    if (
      [...data.routines, ...sessions].some(
        (r) => !unique(r.items.map((i) => i.id)),
      ) ||
      sessions.some((w) =>
        w.items.some((i) => !unique(i.sets.map((s) => s.id))),
      )
    )
      ctx.addIssue({ code: "custom", message: "Duplicate item or set IDs" });
    if (
      sessions.some((w) =>
        w.items.some((i) => i.sets.some((s) => s.done && s.reps < 1)),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Completed sets must have at least one rep",
      });
    if (
      data.active?.endedAt ||
      (data.active && data.workouts.some((w) => w.id === data.active?.id))
    )
      ctx.addIssue({ code: "custom", message: "Invalid active session" });
    if (data.workouts.some((w) => !w.endedAt || w.endedAt < w.startedAt))
      ctx.addIssue({
        code: "custom",
        message: "Invalid completed workout dates",
      });
    if (
      data.measurements.some(
        (m) =>
          isNaN(Date.parse(m.date)) ||
          new Date(m.date).toISOString().slice(0, 10) !== m.date,
      )
    )
      ctx.addIssue({ code: "custom", message: "Invalid measurement date" });
  });
export type Exercise = z.infer<typeof exerciseSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Routine = z.infer<typeof routineSchema>;
export type RoutineItem = z.infer<typeof routineItemSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutItem = z.infer<typeof workoutItemSchema>;
export type WorkoutSet = z.infer<typeof setSchema>;
export type Measurement = z.infer<typeof measurementSchema>;
export type Data = z.infer<typeof dataSchema>;
export type Food = z.infer<typeof foodSchema>;
export type GoalsData = z.infer<typeof goalsSchema>;
export type Reminder = z.infer<typeof reminderSchema>;
export type Page =
  | "Dashboard"
  | "Routines"
  | "Exercises"
  | "History"
  | "Progress"
  | "Measurements"
  | "Settings"
  | "Workout"
  | "Nutrition"
  | "Goals";
