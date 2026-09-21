import { useState } from "react";
import {
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "../store";
import {
  completedSets,
  dayKey,
  displayWeight,
  duration,
  fmt,
  volume,
  weeklyStreak,
} from "../domain";
import { workoutSchema, type Workout } from "../model";
import { PageHeader, Empty, Modal, Field, Confirm } from "../components/ui";
import { SetEditor } from "./Workout";
export function WorkoutDetail({
  workout,
  onClose,
}: {
  workout: Workout;
  onClose: () => void;
}) {
  const { data, setData, notice } = useStore();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Workout>(workout);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(dayKey(workout.startedAt));
  const [mins, setMins] = useState(duration(workout));
  return (
    <>
      <Modal
        wide
        title={edit ? "Edit workout" : workout.name}
        onClose={onClose}
      >
        {edit ? (
          <>
            <div className="form-grid">
              <Field label="Workout name">
                <input
                  required
                  maxLength={100}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Date">
                <input
                  required
                  type="date"
                  max={dayKey()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label="Duration (minutes)">
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={mins}
                  onChange={(e) => setMins(Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="spacer" />
            <SetEditor workout={draft} update={setDraft} editing />
            <Field label="Notes">
              <textarea
                maxLength={2000}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </Field>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setEdit(false)}
              >
                Cancel
              </button>
              <button
                className="button lime"
                onClick={() => {
                  const start = new Date(workout.startedAt);
                  const [year, month, day] = date.split("-").map(Number);
                  start.setFullYear(year, month - 1, day);
                  if (
                    !draft.name.trim() ||
                    isNaN(start.getTime()) ||
                    date > dayKey() ||
                    mins < 0 ||
                    mins > 1440 ||
                    !Number.isFinite(mins)
                  ) {
                    setError(
                      "Enter a name, a valid past date, and a duration between 0 and 1440 minutes.",
                    );
                    return;
                  }
                  const next = {
                    ...draft,
                    startedAt: start.toISOString(),
                    endedAt: new Date(
                      start.getTime() + mins * 60000,
                    ).toISOString(),
                  };
                  if (
                    !workoutSchema.safeParse(next).success ||
                    !completedSets(next)
                  ) {
                    setError("Complete at least one valid set before saving.");
                    return;
                  }
                  setData((d) => ({
                    ...d,
                    workouts: d.workouts.map((w) =>
                      w.id === next.id ? next : w,
                    ),
                  }));
                  notice(
                    "Workout updated. Your charts and records have been recalculated.",
                  );
                  onClose();
                }}
              >
                Save changes
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="detail-meta">
              <span>
                {new Date(workout.startedAt).toLocaleDateString("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <div className="inline-actions">
                <button
                  className="button secondary"
                  onClick={() => setEdit(true)}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete workout"
                  onClick={() => setRemove(true)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="mini-stats">
              <div>
                <span>Duration</span>
                <strong>{duration(workout)}</strong>
                <small>minutes</small>
              </div>
              <div>
                <span>Total volume</span>
                <strong>
                  {fmt(displayWeight(volume(workout), data.profile.units))}
                </strong>
                <small>{data.profile.units}</small>
              </div>
              <div>
                <span>Completed sets</span>
                <strong>{completedSets(workout)}</strong>
                <small>sets</small>
              </div>
            </div>
            {workout.items.map((item) => (
              <section className="breakdown" key={item.id}>
                <h3>
                  {data.exercises.find((e) => e.id === item.exerciseId)?.name}
                  {item.superset && (
                    <span className="badge">Superset {item.superset}</span>
                  )}
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th>Set</th>
                      <th>Type</th>
                      <th>Weight</th>
                      <th>Reps</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.sets.map((s, i) => (
                      <tr key={s.id} className={!s.done ? "incomplete" : ""}>
                        <td>{i + 1}</td>
                        <td>
                          {s.type === "normal"
                            ? "Working"
                            : s.type === "warmup"
                              ? "Warm-up"
                              : s.type === "failure"
                                ? "Failure"
                                : "Drop"}
                        </td>
                        <td>
                          {fmt(displayWeight(s.weight, data.profile.units))}{" "}
                          {data.profile.units}
                        </td>
                        <td>{s.reps}</td>
                        <td>{s.done ? "Complete" : "Skipped"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
            {workout.notes && (
              <div className="form-cue">
                <strong>Session notes</strong>
                <p>{workout.notes}</p>
              </div>
            )}
          </>
        )}
      </Modal>
      {remove && (
        <Confirm
          title="Delete this workout?"
          onClose={() => setRemove(false)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              workouts: d.workouts.filter((w) => w.id !== workout.id),
            }));
            notice("Workout deleted. Progress has been recalculated.");
            onClose();
          }}
        >
          This permanently removes the workout and its contribution to your
          charts and records.
        </Confirm>
      )}
    </>
  );
}
export function History({
  openWorkout,
}: {
  openWorkout: (w: Workout) => void;
}) {
  const { data } = useStore();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const monthly = data.workouts
    .filter((w) => {
      const d = new Date(w.startedAt);
      return (
        d.getMonth() === month.getMonth() &&
        d.getFullYear() === month.getFullYear()
      );
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const shown = selected
    ? monthly.filter((w) => dayKey(w.startedAt) === selected)
    : monthly;
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <>
      <PageHeader
        eyebrow="EVERY SESSION MATTERS"
        title="Training history"
        description="A record of the work you're putting in."
        action={
          <div className="segmented">
            <button
              aria-label="List view"
              className={view === "list" ? "active" : ""}
              onClick={() => {
                setView("list");
                setSelected(null);
              }}
            >
              <List size={17} />
              List
            </button>
            <button
              aria-label="Calendar view"
              className={view === "calendar" ? "active" : ""}
              onClick={() => setView("calendar")}
            >
              <CalendarDays size={17} />
              Calendar
            </button>
          </div>
        }
      />
      <div className="history-toolbar">
        <div className="month-switch">
          <button
            aria-label="Previous month"
            className="icon-button"
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
              setSelected(null);
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2>
            {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
          </h2>
          <button
            aria-label="Next month"
            className="icon-button"
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
              setSelected(null);
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <span className="muted">
          {monthly.length} workouts this month · {weeklyStreak(data.workouts)}{" "}
          week streak
        </span>
      </div>
      {view === "calendar" && (
        <section className="card history-calendar">
          <div className="month-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span className="calendar-label" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = dayKey(
                new Date(month.getFullYear(), month.getMonth(), i + 1),
              );
              const logged = monthly.filter(
                (w) => dayKey(w.startedAt) === date,
              );
              return (
                <button
                  key={i}
                  className={`${logged.length ? "logged" : ""} ${selected === date ? "selected-day" : ""} ${date === dayKey() ? "current-day" : ""}`}
                  onClick={() => setSelected(date)}
                  aria-label={`${date}, ${logged.length} workouts`}
                >
                  <span>{i + 1}</span>
                  {logged.map((w) => (
                    <small key={w.id}>{w.name}</small>
                  ))}
                </button>
              );
            })}
          </div>
        </section>
      )}
      {selected && (
        <div className="selection-label">
          Workouts on {selected}
          <button className="text-button" onClick={() => setSelected(null)}>
            Show entire month
            <X size={14} />
          </button>
        </div>
      )}
      <div className="history-list">
        {shown.map((w) => (
          <button
            className="card history-row"
            key={w.id}
            onClick={() => openWorkout(w)}
          >
            <div className="history-date">
              <strong>{new Date(w.startedAt).getDate()}</strong>
              <small>
                {new Date(w.startedAt).toLocaleDateString("en", {
                  weekday: "short",
                })}
              </small>
            </div>
            <div>
              <h3>{w.name}</h3>
              <p>
                {w.items.length} exercises · {completedSets(w)} completed sets
              </p>
            </div>
            <div className="history-row-stat">
              <strong>
                {fmt(displayWeight(volume(w), data.profile.units))}{" "}
                {data.profile.units}
              </strong>
              <small>Total volume</small>
            </div>
            <div className="history-row-stat">
              <strong>{duration(w)} min</strong>
              <small>Duration</small>
            </div>
            <ArrowUpRight size={19} />
          </button>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title={
            selected ? "A rest day in the books" : "No workouts this month"
          }
          text={
            selected
              ? "Recovery is part of getting stronger. Choose another day to see your sessions."
              : "Your completed sessions will appear here. Use the arrows to explore another month."
          }
        />
      )}
    </>
  );
}
