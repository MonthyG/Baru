import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Utensils,
} from "lucide-react";
import { useStore } from "../store";
import { foodSchema, type Food } from "../model";
import { addDays, dayKey, fmt, uid } from "../domain";
import { foodTotals, targetStatus } from "../wellness";
import {
  PageHeader,
  Modal,
  Field,
  Confirm,
  Empty,
  Chart,
  SectionTitle,
} from "../components/ui";
export function NutritionSummary({ date = dayKey() }: { date?: string }) {
  const { data } = useStore();
  const totals = foodTotals(data.foods, date);
  return (
    <div className="nutrition-summary">
      {(["calories", "protein"] as const).map((k) => (
        <section className="card stat" key={k}>
          <span className="stat-label">
            {k === "calories" ? "Calories" : "Protein"}
            <Utensils size={17} />
          </span>
          <strong>
            {fmt(totals[k])}
            <small>
              {" "}
              / {data.goals[k] === null ? "—" : fmt(data.goals[k]!)}{" "}
              {k === "calories" ? "kcal" : "g"}
            </small>
          </strong>
          <div className="goal-track">
            <span
              style={{
                width: `${data.goals[k] ? Math.min(100, (totals[k] / data.goals[k]!) * 100) : 0}%`,
              }}
            />
          </div>
          <span className="stat-note">
            {k === "protein" &&
            data.goals.protein !== null &&
            totals.protein >= data.goals.protein
              ? "Protein target fulfilled"
              : targetStatus(
                  totals[k],
                  data.goals[k],
                  k === "calories" ? "kcal" : "g",
                )}
          </span>
        </section>
      ))}
    </div>
  );
}
function FoodForm({
  food,
  date,
  onClose,
}: {
  food: Food | null;
  date: string;
  onClose: () => void;
}) {
  const { setData, notice } = useStore();
  const [draft, setDraft] = useState<Food>(
    food || {
      id: uid(),
      name: "",
      date,
      meal: "Breakfast",
      servings: 1,
      calories: 0,
      protein: 0,
    },
  );
  const [error, setError] = useState("");
  return (
    <Modal
      title={food ? "Edit food entry" : "Log a meal or food"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = foodSchema.safeParse(draft);
          if (!parsed.success || draft.date > dayKey()) {
            setError(
              "Enter a food name, valid past date, positive servings, and nonnegative nutrition values.",
            );
            return;
          }
          setData((d) => ({
            ...d,
            foods: food
              ? d.foods.map((f) => (f.id === food.id ? parsed.data : f))
              : [...d.foods, parsed.data],
          }));
          notice("Food entry saved");
          onClose();
        }}
      >
        <Field label="Food or meal name">
          <input
            autoFocus
            required
            maxLength={100}
            placeholder="e.g. Chicken, rice and vegetables"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Date">
            <input
              required
              type="date"
              max={dayKey()}
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              onBlur={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
          <Field label="Meal">
            <select
              value={draft.meal}
              onChange={(e) =>
                setDraft({ ...draft, meal: e.target.value as Food["meal"] })
              }
            >
              {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="help muted">
          Enter the calories and protein per serving from a food label or your
          own estimate. For a whole meal, use one serving.
        </p>
        <div className="form-grid">
          <Field label="Calories per serving (kcal)">
            <input
              required
              type="number"
              inputMode="decimal"
              min={0}
              max={10000}
              step="0.1"
              value={draft.calories}
              onChange={(e) =>
                setDraft({ ...draft, calories: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Protein per serving (g)">
            <input
              required
              type="number"
              inputMode="decimal"
              min={0}
              max={1000}
              step="0.1"
              value={draft.protein}
              onChange={(e) =>
                setDraft({ ...draft, protein: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Servings eaten">
            <input
              required
              type="number"
              inputMode="decimal"
              min={0.1}
              max={100}
              step="0.1"
              value={draft.servings}
              onChange={(e) =>
                setDraft({ ...draft, servings: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <div className="form-cue">
          This entry: <b>{fmt(draft.calories * draft.servings)} kcal</b> ·{" "}
          <b>{fmt(draft.protein * draft.servings)} g protein</b>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" className="button lime">
          Save food
        </button>
      </form>
    </Modal>
  );
}
export function Nutrition({ openGoals }: { openGoals: () => void }) {
  const { data, setData, notice } = useStore();
  const [date, setDate] = useState(dayKey());
  const [edit, setEdit] = useState<Food | null | undefined>();
  const [remove, setRemove] = useState<Food | null>(null);
  const entries = data.foods.filter((f) => f.date === date);
  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = dayKey(addDays(new Date(`${date}T12:00:00`), i - 6));
    return {
      label: new Date(`${d}T12:00:00`).toLocaleDateString("en", {
        weekday: "short",
      }),
      ...foodTotals(data.foods, d),
    };
  });
  return (
    <>
      <PageHeader
        eyebrow="FUEL YOUR PROGRESS"
        title="Food & nutrition"
        description="Your daily intake, one meal at a time."
        action={
          <button className="button" onClick={() => setEdit(null)}>
            <Plus size={17} />
            Log food
          </button>
        }
      />
      <div className="history-toolbar">
        <div className="month-switch">
          <button
            className="icon-button"
            aria-label="Previous day"
            onClick={() =>
              setDate(dayKey(addDays(new Date(`${date}T12:00:00`), -1)))
            }
          >
            <ChevronLeft size={20} />
          </button>
          <input
            className="control"
            aria-label="Food log date"
            type="date"
            max={dayKey()}
            value={date}
            onChange={(e) => {
              if (e.target.value && e.target.value <= dayKey())
                setDate(e.target.value);
            }}
          />
          <button
            className="icon-button"
            aria-label="Next day"
            disabled={date >= dayKey()}
            onClick={() =>
              setDate(dayKey(addDays(new Date(`${date}T12:00:00`), 1)))
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button className="button secondary" onClick={openGoals}>
          Edit nutrition targets
        </button>
      </div>
      <NutritionSummary date={date} />
      {!entries.length ? (
        <Empty
          title="A fresh page for your food log"
          text="Log your first meal to see calories and protein add up. No meals are pre-filled."
          action="Log food"
          onClick={() => setEdit(null)}
        />
      ) : (
        <div className="meal-groups">
          {(["Breakfast", "Lunch", "Dinner", "Snack"] as const)
            .filter((meal) => entries.some((f) => f.meal === meal))
            .map((meal) => (
              <section className="card" key={meal}>
                <SectionTitle title={meal} />
                {entries
                  .filter((f) => f.meal === meal)
                  .map((f) => (
                    <div className="food-row" key={f.id}>
                      <div>
                        <strong>{f.name}</strong>
                        <p>
                          {fmt(f.servings)}{" "}
                          {f.servings === 1 ? "serving" : "servings"} ·{" "}
                          {fmt(f.calories * f.servings)} kcal ·{" "}
                          {fmt(f.protein * f.servings)} g protein
                        </p>
                      </div>
                      <div className="inline-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${f.name}`}
                          onClick={() => setEdit(f)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${f.name}`}
                          onClick={() => setRemove(f)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </section>
            ))}
        </div>
      )}
      <div className="analytics-grid mt">
        <section className="card">
          <SectionTitle title="Calories · last 7 days" />
          <Chart
            data={chart.map((d) => ({ label: d.label, value: d.calories }))}
            bars
            label="Calories"
            unit="kcal"
          />
        </section>
        <section className="card">
          <SectionTitle title="Protein · last 7 days" />
          <Chart
            data={chart.map((d) => ({ label: d.label, value: d.protein }))}
            bars
            label="Protein"
            unit="g"
          />
        </section>
      </div>
      <p className="help muted mt">
        Totals reflect logged food only. A day with no entries does not mean no
        food was eaten. Targets are personal tracking goals, not nutrition
        prescriptions.
      </p>
      {edit !== undefined && (
        <FoodForm food={edit} date={date} onClose={() => setEdit(undefined)} />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete this food entry?"
          onClose={() => setRemove(null)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              foods: d.foods.filter((f) => f.id !== remove.id),
            }));
            notice("Food entry deleted");
          }}
        >
          Remove {remove.name} from {remove.date}? Your daily totals will
          update.
        </Confirm>
      )}
    </>
  );
}
