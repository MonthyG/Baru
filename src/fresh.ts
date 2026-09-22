import { dataSchema, type Data } from "./model";
import { catalog } from "./seed";

// The exercise catalog is reference material. No sample personal activity is loaded.
export function freshData(): Data {
  return dataSchema.parse({
    version: 1,
    profile: {
      name: "You",
      units: "kg",
      experience: "Beginner",
      days: 3,
      goal: "General fitness",
      equipment: ["Bodyweight"],
      theme: "light",
      rest: 90,
      onboarded: false,
      age: null,
      height: null,
    },
    exercises: structuredClone(catalog),
    favorites: [],
    routines: [],
    workouts: [],
    measurements: [],
    active: null,
    foods: [],
    goals: { calories: null, protein: null, weight: null, date: null },
    reminders: [],
  });
}
