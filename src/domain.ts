import type {
  Data,
  Exercise,
  Profile,
  Routine,
  Workout,
  WorkoutSet,
} from "./model";
export const uid = () => crypto.randomUUID();
export const dayKey = (date: Date | string = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const addDays = (date: Date, n: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
export const weekStart = (date = new Date()) => {
  const d = addDays(date, -((date.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
};
export const displayWeight = (kg: number, units: Profile["units"]) =>
  Math.round(kg * (units === "lb" ? 2.2046226218 : 1) * 10) / 10;
export const toKg = (n: number, units: Profile["units"]) =>
  n / (units === "lb" ? 2.2046226218 : 1);
export const fmt = (n: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);
export const volume = (w: Workout) =>
  w.items.reduce(
    (n, i) =>
      n + i.sets.reduce((s, x) => s + (x.done ? x.weight * x.reps : 0), 0),
    0,
  );
export const completedSets = (w: Workout) =>
  w.items.reduce((n, i) => n + i.sets.filter((s) => s.done).length, 0);
export const e1rm = (s: WorkoutSet) =>
  s.done && s.reps > 0 && s.type !== "warmup"
    ? s.weight * (s.reps === 1 ? 1 : 1 + s.reps / 30)
    : 0;
export const duration = (w: Workout) =>
  Math.max(
    0,
    Math.round(
      ((w.endedAt ? new Date(w.endedAt).getTime() : Date.now()) -
        new Date(w.startedAt).getTime()) /
        60000,
    ),
  );
export const timeText = (seconds: number) =>
  `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, "0")}`;
export function records(workouts: Workout[], exerciseId: string) {
  const sets = workouts
    .flatMap((w) =>
      w.items.filter((i) => i.exerciseId === exerciseId).flatMap((i) => i.sets),
    )
    .filter((s) => s.done && s.type !== "warmup" && s.reps > 0);
  return {
    weight: Math.max(0, ...sets.map((s) => s.weight)),
    e1rm: Math.max(0, ...sets.map(e1rm)),
    volume: Math.max(0, ...sets.map((s) => s.weight * s.reps)),
    best: [...sets].sort((a, b) => e1rm(b) - e1rm(a))[0],
  };
}
export function newRecords(
  w: Workout,
  previous: Workout[],
  exercises: Exercise[],
) {
  return [...new Set(w.items.map((i) => i.exerciseId))].flatMap((id) => {
    const before = records(previous, id);
    const now = records([w], id);
    return (["weight", "e1rm", "volume"] as const)
      .filter((k) => now[k] > before[k] && now[k] > 0)
      .map((kind) => ({
        exerciseId: id,
        name: exercises.find((e) => e.id === id)?.name || "Exercise",
        kind,
        value: now[kind],
      }));
  });
}
export function lastSets(workouts: Workout[], exerciseId: string) {
  return (
    [...workouts]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .find((w) => w.items.some((i) => i.exerciseId === exerciseId))
      ?.items.find((i) => i.exerciseId === exerciseId)?.sets || []
  );
}
export function startWorkout(routine: Routine, workouts: Workout[]): Workout {
  return {
    id: uid(),
    name: routine.name,
    routineId: routine.id,
    startedAt: new Date().toISOString(),
    notes: "",
    restUntil: null,
    restDuration: 0,
    items: routine.items.map((item) => {
      const last = lastSets(workouts, item.exerciseId);
      return {
        id: uid(),
        exerciseId: item.exerciseId,
        rest: item.rest,
        superset: item.superset,
        sets: Array.from({ length: item.sets }, (_, i) => ({
          id: uid(),
          weight: last[i]?.weight || 0,
          reps: last[i]?.reps || item.minReps,
          done: false,
          type: "normal" as const,
        })),
      };
    }),
  };
}
export function weeklyStreak(workouts: Workout[], now = new Date()) {
  const keys = new Set(
    workouts.map((w) => dayKey(weekStart(new Date(w.startedAt)))),
  );
  let d = weekStart(now);
  if (!keys.has(dayKey(d))) d = addDays(d, -7);
  let streak = 0;
  while (keys.has(dayKey(d))) {
    streak++;
    d = addDays(d, -7);
  }
  return streak;
}
export const trainingOffsets = (days: number) =>
  Array.from({ length: days }, (_, i) => Math.floor((i * 7) / days));
export function nextScheduled(data: Data) {
  const completed = data.workouts.filter(
    (w) => new Date(w.startedAt) >= weekStart(),
  ).length;
  const routine = data.routines.length
    ? data.routines[completed % data.routines.length]
    : null;
  let date = new Date();
  const offsets = trainingOffsets(data.profile.days);
  for (let i = 0; i < 8; i++) {
    const candidate = addDays(new Date(), i);
    if (
      offsets.includes((candidate.getDay() + 6) % 7) &&
      !data.workouts.some((w) => dayKey(w.startedAt) === dayKey(candidate))
    ) {
      date = candidate;
      break;
    }
  }
  return { routine, date };
}
export function personalizedRoutine(
  profile: Profile,
  exercises: Exercise[],
): Routine {
  const targets: Exercise["muscle"][] =
    profile.days >= 4
      ? ["Quads", "Chest", "Back", "Shoulders", "Core"]
      : ["Quads", "Hamstrings", "Chest", "Back", "Core"];
  const available = exercises.filter((e) =>
    profile.equipment.includes(e.equipment),
  );
  const beginnerPreferences: Partial<Record<Exercise["muscle"], string[]>> = {
    Quads: [
      "Goblet Squat",
      "Kettlebell Goblet Squat",
      "Bodyweight Squat",
      "Leg Press",
    ],
    Hamstrings: [
      "Dumbbell Romanian Deadlift",
      "Kettlebell Deadlift",
      "Seated Leg Curl",
      "Glute Bridge",
    ],
    Chest: [
      "Dumbbell Bench Press",
      "Machine Chest Press",
      "Kettlebell Floor Press",
      "Push-Up",
    ],
    Back: [
      "Seated Cable Row",
      "One-Arm Dumbbell Row",
      "Kettlebell Row",
      "Inverted Row",
    ],
    Shoulders: [
      "Dumbbell Shoulder Press",
      "Kettlebell Overhead Press",
      "Band Overhead Press",
      "Pike Push-Up",
    ],
    Core: ["Dead Bug", "Reverse Crunch", "Cable Crunch"],
  };
  const matches = targets
    .map(
      (m) =>
        (profile.experience === "Beginner"
          ? beginnerPreferences[m]
              ?.map((name) => available.find((e) => e.name === name))
              .find(Boolean)
          : undefined) || available.find((e) => e.muscle === m),
    )
    .filter((e): e is Exercise => !!e);
  const selected = matches.length ? matches : available.slice(0, 5);
  return {
    id: uid(),
    name: `${profile.name.split(" ")[0]}'s ${profile.goal === "Strength" ? "foundation" : profile.goal === "Muscle" ? "builder" : "full body"}`,
    description: `${profile.experience} · ${profile.days} days per week · ${profile.goal.toLowerCase()} focus. Repeat on your scheduled days.`,
    items: selected.map((e) => ({
      id: uid(),
      exerciseId: e.id,
      sets:
        profile.experience === "Beginner"
          ? 2
          : profile.experience === "Advanced"
            ? 4
            : 3,
      minReps: profile.goal === "Strength" ? 5 : 8,
      maxReps: profile.goal === "Strength" ? 8 : 12,
      rest: profile.goal === "Strength" ? 150 : 90,
      superset: "",
    })),
  };
}
