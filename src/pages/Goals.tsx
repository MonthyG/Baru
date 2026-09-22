import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Bell } from "lucide-react";
import { useStore } from "../store";
import {
  goalsSchema,
  reminderSchema,
  type GoalsData,
  type Reminder,
} from "../model";
import { dayKey, displayWeight, toKg, uid, fmt, weekStart } from "../domain";
import {
  Field,
  Modal,
  Confirm,
  PageHeader,
  SectionTitle,
  Empty,
} from "../components/ui";
export function GoalFields({
  goals,
  onChange,
  units,
}: {
  goals: GoalsData;
  onChange: (g: GoalsData) => void;
  units: "kg" | "lb";
}) {
  return (
    <div className="form-grid">
      <Field label="Daily calorie target (kcal)">
        <input
          type="number"
          min={100}
          max={10000}
          step={1}
          placeholder="Optional"
          value={goals.calories ?? ""}
          onChange={(e) =>
            onChange({
              ...goals,
              calories: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </Field>
      <Field label="Daily protein target (g)">
        <input
          type="number"
          min={1}
          max={1000}
          step="0.1"
          placeholder="Optional"
          value={goals.protein ?? ""}
          onChange={(e) =>
            onChange({
              ...goals,
              protein: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </Field>
      <Field label={`Target bodyweight (${units})`}>
        <input
          type="number"
          min={displayWeight(20, units)}
          max={displayWeight(500, units)}
          step="0.1"
          placeholder="Optional"
          value={
            goals.weight === null ? "" : displayWeight(goals.weight, units)
          }
          onChange={(e) =>
            onChange({
              ...goals,
              weight: e.target.value
                ? toKg(Number(e.target.value), units)
                : null,
            })
          }
        />
      </Field>
      <Field label="Target date (optional)">
        <input
          type="date"
          value={goals.date ?? ""}
          onChange={(e) => onChange({ ...goals, date: e.target.value || null })}
          onBlur={(e) => onChange({ ...goals, date: e.target.value || null })}
        />
      </Field>
    </div>
  );
}
function ReminderForm({
  reminder,
  onClose,
}: {
  reminder: Reminder | null;
  onClose: () => void;
}) {
  const { setData, notice } = useStore();
  const [draft, setDraft] = useState<Reminder>(
    reminder || {
      id: uid(),
      title: "Time to train",
      kind: "Workout",
      time: "18:00",
      days: [1, 3, 5],
      enabled: true,
      dismissed: null,
      notified: null,
    },
  );
  const [error, setError] = useState("");
  return (
    <Modal
      title={reminder ? "Edit reminder" : "Create a reminder"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = reminderSchema.safeParse({
            ...draft,
            dismissed: null,
            notified: null,
          });
          if (!parsed.success) {
            setError("Enter a title, a valid time, and at least one day.");
            return;
          }
          setData((d) => ({
            ...d,
            reminders: reminder
              ? d.reminders.map((r) => (r.id === reminder.id ? parsed.data : r))
              : [...d.reminders, parsed.data],
          }));
          notice("Reminder saved");
          onClose();
        }}
      >
        <Field label="Reminder title">
          <input
            required
            maxLength={100}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Reminder for">
            <select
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value as Reminder["kind"] })
              }
            >
              {["Workout", "Food", "Weigh-in"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Time (this device's timezone)">
            <input
              required
              type="time"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              onBlur={(e) => setDraft({ ...draft, time: e.target.value })}
            />
          </Field>
        </div>
        <div className="choice-wrap">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <button
              type="button"
              key={d}
              aria-pressed={draft.days.includes(i)}
              className={`choice ${draft.days.includes(i) ? "chosen" : ""}`}
              onClick={() =>
                setDraft({
                  ...draft,
                  days: draft.days.includes(i)
                    ? draft.days.filter((n) => n !== i)
                    : [...draft.days, i],
                })
              }
            >
              {d}
            </button>
          ))}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button lime">
          Save reminder
        </button>
      </form>
    </Modal>
  );
}
export function Goals() {
  const { data, setData, notice } = useStore();
  const [goals, setGoals] = useState(data.goals);
  const [days, setDays] = useState(data.profile.days);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState<Reminder | null | undefined>();
  const [remove, setRemove] = useState<Reminder | null>(null);
  const [permission, setPermission] = useState(
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission,
  );
  useEffect(() => {
    setGoals(data.goals);
    setDays(data.profile.days);
  }, [data.goals, data.profile.days]);
  const measurements = [...data.measurements].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const current = measurements.at(-1)?.weight;
  const initial = measurements[0]?.weight;
  const target = data.goals.weight;
  const goalMet =
    current !== undefined &&
    initial !== undefined &&
    target !== null &&
    (target >= initial ? current >= target : current <= target);
  const weeks = data.workouts.filter(
    (w) => new Date(w.startedAt) >= weekStart(),
  ).length;
  return (
    <>
      <PageHeader
        eyebrow="MAKE PROGRESS INTENTIONAL"
        title="Goals & reminders"
        description="Set your direction. Build habits that last."
      />
      <div className="stat-grid">
        <section className="card stat">
          <span className="stat-label">Weekly training goal</span>
          <strong>
            {weeks}
            <small> / {data.profile.days} sessions</small>
          </strong>
          <span className="stat-note">
            {weeks >= data.profile.days
              ? "Weekly goal reached"
              : `${data.profile.days - weeks} sessions remaining`}
          </span>
        </section>
        <section className="card stat">
          <span className="stat-label">Bodyweight goal</span>
          <strong>
            {target === null
              ? "—"
              : fmt(displayWeight(target, data.profile.units))}
            <small> {data.profile.units}</small>
          </strong>
          <span className="stat-note">
            {target === null
              ? "Set a target below"
              : current === undefined
                ? "Log your first bodyweight"
                : goalMet
                  ? "Target reached"
                  : `${fmt(displayWeight(Math.abs(current - target), data.profile.units))} ${data.profile.units} from your target`}
          </span>
        </section>
        <section className="card stat">
          <span className="stat-label">Target date</span>
          <strong style={{ fontSize: 22 }}>
            {data.goals.date || "Your pace"}
          </strong>
          <span className="stat-note">
            {data.goals.date && data.goals.date < dayKey()
              ? "Review your target and choose your next step."
              : "Adjust your goals whenever life changes."}
          </span>
        </section>
      </div>
      <section className="card">
        <SectionTitle title="Your targets" />
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const result = goalsSchema.safeParse(goals);
            if (!result.success || (!goals.weight && goals.date)) {
              setError(
                "Check your target values. Add a weight target if you choose a target date.",
              );
              return;
            }
            setData((d) => ({
              ...d,
              goals: result.data,
              profile: { ...d.profile, days },
            }));
            setError("");
            notice("Goals saved");
          }}
        >
          <GoalFields
            goals={goals}
            onChange={setGoals}
            units={data.profile.units}
          />
          <Field label="Workouts per week">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <p className="help muted">
            Nutrition targets are yours to choose. Use targets you have agreed
            with a qualified professional if you need individual guidance. Leave
            a field blank to remove that target.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button lime fit">
            Save goals
          </button>
        </form>
      </section>
      <div className="spacer" />
      <SectionTitle title="Your reminders" />
      <section className="card">
        <div className="reminder-intro">
          <p className="help muted">
            Reminders appear while IronLog is open and when you return later
            that day. Browser notifications are optional and also require the
            app to stay open; this local app cannot send reminders after it is
            closed.
          </p>
          <button
            className="button secondary"
            disabled={
              permission === "unsupported" ||
              permission === "granted" ||
              permission === "denied"
            }
            onClick={async () => {
              try {
                const next = await Notification.requestPermission();
                setPermission(next);
                notice(
                  next === "granted"
                    ? "Browser notifications enabled"
                    : "In-app reminders remain available",
                );
              } catch {
                notice(
                  "Browser notifications are unavailable. In-app reminders still work.",
                );
              }
            }}
          >
            <Bell size={16} />
            {permission === "granted"
              ? "Notifications enabled"
              : permission === "denied"
                ? "Notifications blocked in browser"
                : permission === "unsupported"
                  ? "In-app reminders available"
                  : "Enable browser notifications"}
          </button>
        </div>
        <button
          className="button lime mt"
          onClick={() => setEdit(null)}
          disabled={data.reminders.length >= 50}
        >
          <Plus size={17} />
          Add reminder
        </button>
        {!data.reminders.length && (
          <Empty
            title="A nudge at the right time"
            text="Create a workout, meal-log, or weigh-in reminder."
          />
        )}
        {data.reminders.map((r) => (
          <div className="food-row" key={r.id}>
            <div>
              <strong>{r.title}</strong>
              <p>
                {r.kind} · {r.time} ·{" "}
                {[...r.days]
                  .sort()
                  .map(
                    (i) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
                  )
                  .join(", ")}
              </p>
            </div>
            <div className="inline-actions">
              <button
                className="choice"
                aria-label={`${r.enabled ? "Pause" : "Enable"} ${r.title}`}
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    reminders: d.reminders.map((x) =>
                      x.id === r.id ? { ...x, enabled: !x.enabled } : x,
                    ),
                  }))
                }
              >
                {r.enabled ? "On" : "Paused"}
              </button>
              <button
                className="icon-button"
                aria-label={`Edit reminder ${r.title}`}
                onClick={() => setEdit(r)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={`Delete reminder ${r.title}`}
                onClick={() => setRemove(r)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>
      {edit !== undefined && (
        <ReminderForm reminder={edit} onClose={() => setEdit(undefined)} />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete this reminder?"
          onClose={() => setRemove(null)}
          onConfirm={() =>
            setData((d) => ({
              ...d,
              reminders: d.reminders.filter((r) => r.id !== remove.id),
            }))
          }
        >
          {remove.title} will no longer appear.
        </Confirm>
      )}
    </>
  );
}
