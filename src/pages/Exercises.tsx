import { useState } from "react";
import {
  Search,
  Star,
  Plus,
  ArrowUpRight,
  Pencil,
  Trash2,
  Dumbbell,
} from "lucide-react";
import { useStore } from "../store";
import {
  muscles,
  equipment,
  exerciseSchema,
  type Exercise,
  type Workout,
} from "../model";
import { displayWeight, e1rm, fmt, records, uid } from "../domain";
import {
  Modal,
  Field,
  PageHeader,
  Empty,
  Chart,
  Confirm,
} from "../components/ui";
export function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const results = data.exercises.filter(
    (e) =>
      (group === "All" || e.muscle === group) &&
      e.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal title="Add an exercise" onClose={onClose}>
      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Search exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Muscle group"
          className="control"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option>All</option>
          {muscles.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="picker-list">
        {results.map((e) => (
          <button key={e.id} onClick={() => onPick(e)} className="picker-row">
            <span className="routine-mark">
              <Dumbbell size={18} />
            </span>
            <span>
              <strong>{e.name}</strong>
              <small>
                {e.muscle} · {e.equipment}
              </small>
            </span>
            <Plus size={18} />
          </button>
        ))}
        {!results.length && (
          <Empty
            title="No exercises found"
            text="Try another name or muscle group."
          />
        )}
      </div>
    </Modal>
  );
}
export function ExerciseForm({
  exercise,
  onClose,
}: {
  exercise?: Exercise;
  onClose: () => void;
}) {
  const { setData, notice } = useStore();
  const [draft, setDraft] = useState<Exercise>(
    exercise || {
      id: uid(),
      name: "",
      muscle: "Chest",
      secondary: [],
      equipment: "Dumbbell",
      cue: "",
      custom: true,
    },
  );
  const [error, setError] = useState("");
  return (
    <Modal
      title={exercise ? "Edit custom exercise" : "Create an exercise"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = exerciseSchema.safeParse(draft);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          setData((d) => ({
            ...d,
            exercises: exercise
              ? d.exercises.map((x) => (x.id === exercise.id ? parsed.data : x))
              : [...d.exercises, parsed.data],
          }));
          notice(exercise ? "Exercise updated" : "Custom exercise added");
          onClose();
        }}
      >
        <Field label="Exercise name">
          <input
            required
            maxLength={100}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Primary muscle">
            <select
              value={draft.muscle}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  muscle: e.target.value as Exercise["muscle"],
                  secondary: draft.secondary.filter(
                    (s) => s !== e.target.value,
                  ),
                })
              }
            >
              {muscles.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Equipment">
            <select
              value={draft.equipment}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  equipment: e.target.value as Exercise["equipment"],
                })
              }
            >
              {equipment.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
        <div>
          <div className="field-label">Secondary muscles</div>
          <div className="choice-wrap">
            {muscles
              .filter((m) => m !== draft.muscle)
              .map((m) => (
                <button
                  type="button"
                  className={`choice ${draft.secondary.includes(m) ? "chosen" : ""}`}
                  key={m}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      secondary: draft.secondary.includes(m)
                        ? draft.secondary.filter((s) => s !== m)
                        : [...draft.secondary, m].slice(0, 8),
                    })
                  }
                >
                  {m}
                </button>
              ))}
          </div>
        </div>
        <Field label="Form cue">
          <textarea
            required
            maxLength={500}
            placeholder="A helpful reminder for each rep…"
            value={draft.cue}
            onChange={(e) => setDraft({ ...draft, cue: e.target.value })}
          />
        </Field>
        {error && <p className="error">{error}</p>}
        <button className="button lime" type="submit">
          Save exercise
        </button>
      </form>
    </Modal>
  );
}
export function ExerciseDetail({
  exercise,
  onClose,
  openWorkout,
}: {
  exercise: Exercise;
  onClose: () => void;
  openWorkout?: (w: Workout) => void;
}) {
  const { data } = useStore();
  const rec = records(data.workouts, exercise.id);
  const history = [...data.workouts]
    .filter((w) =>
      w.items.some(
        (i) => i.exerciseId === exercise.id && i.sets.some((s) => s.done),
      ),
    )
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return (
    <Modal title={exercise.name} onClose={onClose} wide>
      <div className="choice-wrap">
        <span className="badge">{exercise.muscle}</span>
        <span className="badge neutral">{exercise.equipment}</span>
        {exercise.secondary.map((m) => (
          <span className="badge neutral" key={m}>
            {m}
          </span>
        ))}
      </div>
      <p className="form-cue">{exercise.cue}</p>
      <div className="mini-stats">
        <div>
          <span>Best set</span>
          <strong>
            {rec.best
              ? `${fmt(displayWeight(rec.best.weight, data.profile.units))} × ${rec.best.reps}`
              : "—"}
          </strong>
          <small>{data.profile.units} × reps</small>
        </div>
        <div>
          <span>Estimated 1RM</span>
          <strong>
            {rec.e1rm ? fmt(displayWeight(rec.e1rm, data.profile.units)) : "—"}
          </strong>
          <small>{data.profile.units} · Epley formula</small>
        </div>
        <div>
          <span>Times trained</span>
          <strong>{history.length}</strong>
          <small>sessions</small>
        </div>
      </div>
      {history.length ? (
        <>
          <h3 className="subheading">Estimated 1RM progression</h3>
          <Chart
            data={history.map((w) => ({
              label: new Date(w.startedAt).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              }),
              value: displayWeight(
                Math.max(
                  0,
                  ...w.items
                    .filter((i) => i.exerciseId === exercise.id)
                    .flatMap((i) => i.sets.map(e1rm)),
                ),
                data.profile.units,
              ),
            }))}
            label="Estimated 1RM"
            unit={data.profile.units}
          />
          <h3 className="subheading">Exercise history</h3>
          <div className="history-mini">
            {[...history].reverse().map((w) => (
              <div className="detail-history-row" key={w.id}>
                <button
                  className="text-button"
                  onClick={() => openWorkout?.(w)}
                >
                  {new Date(w.startedAt).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {w.name}
                  {openWorkout && <ArrowUpRight size={14} />}
                </button>
                <div>
                  {w.items
                    .filter((i) => i.exerciseId === exercise.id)
                    .flatMap((i) => i.sets.filter((s) => s.done))
                    .map((s, index) => (
                      <span className="set-chip" key={s.id}>
                        {index + 1}.{" "}
                        {fmt(displayWeight(s.weight, data.profile.units))} ×{" "}
                        {s.reps}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Empty
          title="A clean slate"
          text="Log this exercise in a workout to build your strength history."
        />
      )}
    </Modal>
  );
}
export function Exercises({
  openWorkout,
}: {
  openWorkout: (w: Workout) => void;
}) {
  const { data, setData, notice } = useStore();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All muscles");
  const [gear, setGear] = useState("All equipment");
  const [favorites, setFavorites] = useState(false);
  const [customOnly, setCustomOnly] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [edit, setEdit] = useState<Exercise | null | undefined>(undefined);
  const [remove, setRemove] = useState<Exercise | null>(null);
  const filtered = data.exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) &&
      (group === "All muscles" || e.muscle === group) &&
      (gear === "All equipment" || e.equipment === gear) &&
      (!favorites || data.favorites.includes(e.id)) &&
      (!customOnly || e.custom),
  );
  return (
    <>
      <PageHeader
        eyebrow="THE MOVEMENT TOOLKIT"
        title="Exercise library"
        description="Find your next lift. Make every rep count."
        action={
          <button className="button" onClick={() => setEdit(null)}>
            <Plus size={17} />
            Custom exercise
          </button>
        }
      />
      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search exercises"
            placeholder="Search exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className="control"
          aria-label="Filter muscle"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option>All muscles</option>
          {muscles.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          className="control"
          aria-label="Filter equipment"
          value={gear}
          onChange={(e) => setGear(e.target.value)}
        >
          <option>All equipment</option>
          {equipment.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button
          aria-pressed={favorites}
          className={`button secondary ${favorites ? "active-choice" : ""}`}
          onClick={() => setFavorites(!favorites)}
        >
          <Star size={16} />
          Favourites
        </button>
        <button
          aria-pressed={customOnly}
          className={`button secondary ${customOnly ? "active-choice" : ""}`}
          onClick={() => setCustomOnly(!customOnly)}
        >
          Custom
        </button>
      </div>
      <p className="result-count">
        {filtered.length} exercises{" "}
        <span>· A stronger you starts with good form</span>
      </p>
      <div className="exercise-grid">
        {filtered.map((ex) => (
          <article key={ex.id} className="card exercise-card">
            <div className="exercise-top">
              <span className="exercise-monogram">
                {ex.muscle.slice(0, 2).toUpperCase()}
              </span>
              <span className="badge neutral">{ex.equipment}</span>
              <button
                aria-label={`${data.favorites.includes(ex.id) ? "Unfavourite" : "Favourite"} ${ex.name}`}
                className="icon-button favorite"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    favorites: d.favorites.includes(ex.id)
                      ? d.favorites.filter((id) => id !== ex.id)
                      : [...d.favorites, ex.id],
                  }))
                }
              >
                <Star
                  size={18}
                  fill={
                    data.favorites.includes(ex.id) ? "currentColor" : "none"
                  }
                />
              </button>
            </div>
            <button className="exercise-name" onClick={() => setDetail(ex)}>
              {ex.name}
              <ArrowUpRight size={16} />
            </button>
            <p className="exercise-muscles">
              {ex.muscle}
              {ex.secondary.length ? ` · ${ex.secondary.join(", ")}` : ""}
            </p>
            <p className="exercise-cue">{ex.cue}</p>
            {ex.custom && (
              <div className="custom-actions">
                <span className="badge">Custom</span>
                <button
                  className="icon-button"
                  aria-label={`Edit ${ex.name}`}
                  onClick={() => setEdit(ex)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${ex.name}`}
                  onClick={() => setRemove(ex)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title="No matching movements"
          text="Clear a filter or add a custom exercise to make it yours."
          action="Clear filters"
          onClick={() => {
            setQuery("");
            setGroup("All muscles");
            setGear("All equipment");
            setFavorites(false);
            setCustomOnly(false);
          }}
        />
      )}
      {detail && (
        <ExerciseDetail
          exercise={detail}
          onClose={() => setDetail(null)}
          openWorkout={(w) => {
            setDetail(null);
            openWorkout(w);
          }}
        />
      )}
      {edit !== undefined && (
        <ExerciseForm
          exercise={edit || undefined}
          onClose={() => setEdit(undefined)}
        />
      )}
      {remove && (
        <Confirm
          title={`Delete ${remove.name}?`}
          onClose={() => setRemove(null)}
          onConfirm={() => {
            const used = [
              ...data.routines,
              ...data.workouts,
              ...(data.active ? [data.active] : []),
            ].some((w) => w.items.some((i) => i.exerciseId === remove.id));
            if (used) {
              notice(
                "This exercise is in a routine or workout. Remove those references before deleting it.",
              );
              return;
            }
            setData((d) => ({
              ...d,
              exercises: d.exercises.filter((e) => e.id !== remove.id),
              favorites: d.favorites.filter((id) => id !== remove.id),
            }));
            notice("Custom exercise deleted");
          }}
        >
          This removes the exercise from your library. Exercises used in
          routines or logged workouts are protected until those references are
          removed.
        </Confirm>
      )}
    </>
  );
}
