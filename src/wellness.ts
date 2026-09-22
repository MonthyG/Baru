import type { Food, Reminder } from "./model";
import { dayKey } from "./domain";
export function bmi(
  weight: number | null | undefined,
  height: number | null | undefined,
) {
  return weight && height && weight > 0 && height > 0
    ? weight / (height / 100) ** 2
    : null;
}
export function bmiCategory(value: number | null, age: number | null) {
  if (value === null) return "Add weight and height";
  if (age === null) return "Add age for interpretation";
  if (age < 20) return "Age-specific interpretation needed";
  return value < 18.5
    ? "Underweight"
    : value < 25
      ? "Healthy weight"
      : value < 30
        ? "Overweight"
        : "Obesity";
}
export function foodTotals(foods: Food[], date: string) {
  return foods
    .filter((f) => f.date === date)
    .reduce(
      (n, f) => ({
        calories: n.calories + f.calories * f.servings,
        protein: n.protein + f.protein * f.servings,
      }),
      { calories: 0, protein: 0 },
    );
}
export function targetStatus(
  amount: number,
  target: number | null,
  unit: string,
) {
  if (target === null) return "Set a daily target";
  if (amount >= target)
    return amount === target
      ? "Target reached"
      : `${Math.round(amount - target)} ${unit} above target`;
  return `${Math.round((target - amount) * 10) / 10} ${unit} remaining`;
}
export function reminderDue(r: Reminder, now = new Date()) {
  return (
    r.enabled &&
    r.days.includes(now.getDay()) &&
    r.dismissed !== dayKey(now) &&
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` >=
      r.time
  );
}
