import { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Trash2,
  Timer,
  Clock3,
  Layers,
  X,
  SkipForward,
  Trophy,
  ArrowRight,
  Link2,
} from "lucide-react";
import { useStore } from "../store";
import {
  completedSets,
  displayWeight,
  duration,
  fmt,
  lastSets,
  newRecords,
  timeText,
  toKg,
  uid,
  volume,
} from "../domain";
import type { Workout, WorkoutItem, WorkoutSet } from "../model";
import { Confirm, Empty, Field, Modal } from "../components/ui";
import { ExercisePicker } from "./Exercises";
function WeightInput({
  kg,
  units,
  onChange,
  label,
  disabled = false,
}: {
  kg: number;
  units: "kg" | "lb";
  onChange: (n: number) => void;
  label: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(String(displayWeight(kg, units)));
  useEffect(() => setValue(String(displayWeight(kg, units))), [kg, units]);
  return (
    <input
      aria-label={label}
      disabled={disabled}
      inputMode="decimal"
      type="number"
      min="0"
      max={displayWeight(1500, units)}
      step="0.1"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        const n = Number(e.target.value);
        if (
          e.target.value !== "" &&
          Number.isFinite(n) &&
          n >= 0 &&
          toKg(n, units) <= 1500
        )
          onChange(toKg(n, units));
      }}
      onBlur={() => setValue(String(displayWeight(kg, units)))}
    />
  );
}
export function SetEditor({
  workout,
  update,
  editing = false,
}: {
  workout: Workout;
  update: (w: Workout) => void;
  editing?: boolean;
}) {
  const { data, notice } = useStore();
  const [picker, setPicker] = useState(false);
  const [remove, setRemove] = useState<WorkoutItem | null>(null);
  const [removeSet, setRemoveSet] = useState<{
    item: string;
    set: WorkoutSet;
  } | null>(null);
  const patchItem = (id: string, fn: (i: WorkoutItem) => WorkoutItem) =>
    update({
      ...workout,
      items: workout.items.map((i) => (i.id === id ? fn(i) : i)),
    });
  const patchSet = (
    itemId: string,
    setId: string,
    patch: Partial<WorkoutSet>,
  ) =>
    patchItem(itemId, (i) => ({
      ...i,
      sets: i.sets.map((s) =>
        s.id === setId
          ? { ...s, ...patch, ...(patch.reps === 0 ? { done: false } : {}) }
          : s,
      ),
    }));
  const removeSetNow = (item: string, id: string) =>
    patchItem(item, (i) => ({ ...i, sets: i.sets.filter((s) => s.id !== id) }));
  return (
    <>
      <div className="session-exercises">
        {workout.items.map((item, index) => {
          const ex = data.exercises.find((e) => e.id === item.exerciseId);
          const last = lastSets(
            data.workouts.filter(
              (w) => w.id !== workout.id && w.startedAt < workout.startedAt,
            ),
            item.exerciseId,
          );
          return (
            <section className="card session-exercise" key={item.id}>
              <div className="session-exercise-head">
                <span className="order-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{ex?.name}</h2>
                  <p>
                    {ex?.muscle} · {ex?.equipment}
                    {item.superset && (
                      <span className="superset-tag">
                        <Link2 size={12} />
                        Superset {item.superset}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Remove ${ex?.name}`}
                  onClick={() => setRemove(item)}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="session-cue">{ex?.cue}</p>
              <div className="set-table">
                <div className="set-row set-head">
                  <span>SET</span>
                  <span>PREVIOUS</span>
                  <span>{data.profile.units.toUpperCase()}</span>
                  <span>REPS</span>
                  <span>DONE</span>
                  <span />
                </div>
                {item.sets.map((s, si) => (
                  <div
                    className={`set-row ${s.done ? "set-done" : ""}`}
                    key={s.id}
                  >
                    <select
                      aria-label={`${ex?.name} set ${si + 1} type`}
                      value={s.type}
                      onChange={(e) =>
                        patchSet(item.id, s.id, {
                          type: e.target.value as WorkoutSet["type"],
                        })
                      }
                    >
                      <option value="normal">{si + 1}</option>
                      <option value="warmup">W</option>
                      <option value="failure">F</option>
                      <option value="drop">D</option>
                    </select>
                    <span className="previous-set">
                      {last[si]?.done
                        ? `${fmt(displayWeight(last[si].weight, data.profile.units))} × ${last[si].reps}`
                        : "—"}
                    </span>
                    <WeightInput
                      label={`${ex?.name} set ${si + 1} weight`}
                      kg={s.weight}
                      units={data.profile.units}
                      onChange={(weight) => patchSet(item.id, s.id, { weight })}
                    />
                    <input
                      aria-label={`${ex?.name} set ${si + 1} reps`}
                      inputMode="numeric"
                      type="number"
                      min={0}
                      max={500}
                      value={s.reps}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n >= 0 && n <= 500)
                          patchSet(item.id, s.id, { reps: n });
                      }}
                    />
                    <button
                      className="set-check"
                      role="checkbox"
                      aria-checked={s.done}
                      aria-label={`Complete ${ex?.name} set ${si + 1}`}
                      onClick={() => {
                        if (!s.done && s.reps < 1) {
                          notice(
                            "Add at least one rep before completing this set.",
                          );
                          return;
                        }
                        const updated = {
                          ...workout,
                          items: workout.items.map((i) =>
                            i.id === item.id
                              ? {
                                  ...i,
                                  sets: i.sets.map((x) =>
                                    x.id === s.id ? { ...x, done: !x.done } : x,
                                  ),
                                }
                              : i,
                          ),
                        };
                        if (!s.done && !editing) {
                          updated.restUntil = item.rest
                            ? Date.now() + item.rest * 1000
                            : null;
                          updated.restDuration = item.rest;
                        }
                        update(updated);
                      }}
                    >
                      <Check size={20} />
                    </button>
                    <button
                      className="remove-set"
                      aria-label={`Remove set ${si + 1}`}
                      onClick={() =>
                        s.done
                          ? setRemoveSet({ item: item.id, set: s })
                          : removeSetNow(item.id, s.id)
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="exercise-bottom">
                <button
                  className="text-button"
                  onClick={() =>
                    patchItem(item.id, (i) => ({
                      ...i,
                      sets: [
                        ...i.sets,
                        {
                          id: uid(),
                          weight: i.sets.at(-1)?.weight || 0,
                          reps: i.sets.at(-1)?.reps || 8,
                          done: false,
                          type: "normal",
                        },
                      ],
                    }))
                  }
                  disabled={item.sets.length >= 50}
                >
                  <Plus size={15} />
                  Add set
                </button>
                <label className="rest-input">
                  <Timer size={14} />
                  Rest{" "}
                  <input
                    aria-label={`${ex?.name} rest seconds`}
                    type="number"
                    min={0}
                    max={600}
                    value={item.rest}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isInteger(n) && n >= 0 && n <= 600)
                        patchItem(item.id, (i) => ({ ...i, rest: n }));
                    }}
                  />
                  s
                </label>
              </div>
            </section>
          );
        })}
      </div>
      <div className="set-legend">
        Set types: <b>W</b> Warm-up <b>F</b> Failure <b>D</b> Drop set
      </div>
      <button
        className="button secondary add-exercise"
        disabled={workout.items.length >= 50}
        onClick={() => setPicker(true)}
      >
        <Plus size={18} />
        Add exercise
      </button>
      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onPick={(e) => {
            const prior = lastSets(data.workouts, e.id);
            update({
              ...workout,
              items: [
                ...workout.items,
                {
                  id: uid(),
                  exerciseId: e.id,
                  rest: data.profile.rest,
                  superset: "",
                  sets: [
                    {
                      id: uid(),
                      weight: prior[0]?.weight || 0,
                      reps: prior[0]?.reps || 8,
                      done: false,
                      type: "normal",
                    },
                  ],
                },
              ],
            });
            setPicker(false);
          }}
        />
      )}
      {remove && (
        <Confirm
          title="Remove exercise?"
          label="Remove"
          onClose={() => setRemove(null)}
          onConfirm={() =>
            update({
              ...workout,
              items: workout.items.filter((i) => i.id !== remove.id),
            })
          }
        >
          This removes all sets for{" "}
          {data.exercises.find((e) => e.id === remove.exerciseId)?.name} from
          this workout.
        </Confirm>
      )}
      {removeSet && (
        <Confirm
          title="Remove completed set?"
          label="Remove set"
          onClose={() => setRemoveSet(null)}
          onConfirm={() => removeSetNow(removeSet.item, removeSet.set.id)}
        >
          This set is already complete. Removing it will also remove its volume
          from this workout.
        </Confirm>
      )}
    </>
  );
}
export function LiveWorkout({
  onFinish,
  onLeave,
}: {
  onFinish: (w: Workout) => void;
  onLeave: () => void;
}) {
  const { data, setData, notice } = useStore();
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState<"finish" | "discard" | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const w = data.active;
  const update = (next: Workout) => setData((d) => ({ ...d, active: next }));
  if (!w)
    return (
      <Empty
        title="Ready when you are"
        text="Choose a routine to start your next session."
        action="Browse routines"
        onClick={onLeave}
      />
    );
  const remaining = w.restUntil
    ? Math.max(0, Math.ceil((w.restUntil - now) / 1000))
    : 0;
  const count = completedSets(w);
  const total = w.items.reduce((n, i) => n + i.sets.length, 0);
  return (
    <>
      <div className="session-header">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            SESSION IN PROGRESS
          </div>
          <h1>{w.name}</h1>
          <p className="muted">One rep at a time. You've got this.</p>
        </div>
        <button className="button secondary" onClick={onLeave}>
          Minimize
        </button>
      </div>
      <div className="session-stats">
        <div>
          <Clock3 size={18} />
          <span>
            <small>Elapsed time</small>
            <strong>
              {timeText((now - new Date(w.startedAt).getTime()) / 1000)}
            </strong>
          </span>
        </div>
        <div>
          <Layers size={18} />
          <span>
            <small>Total volume</small>
            <strong>
              {fmt(displayWeight(volume(w), data.profile.units))}
              <small> {data.profile.units}</small>
            </strong>
          </span>
        </div>
        <div>
          <Check size={18} />
          <span>
            <small>Completed sets</small>
            <strong>
              {count}
              <small> / {total}</small>
            </strong>
          </span>
        </div>
      </div>
      <div className="session-progress">
        <span style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
      </div>
      <div className="session-layout">
        <div>
          <SetEditor workout={w} update={update} />
          <Field label="Session notes">
            <textarea
              placeholder="How did it feel?"
              maxLength={2000}
              value={w.notes}
              onChange={(e) => update({ ...w, notes: e.target.value })}
            />
          </Field>
          <button
            className="text-button discard-button"
            onClick={() => setConfirm("discard")}
          >
            <Trash2 size={15} />
            Discard workout
          </button>
        </div>
        <aside className="session-side">
          <section
            className={`card rest-card ${w.restUntil ? "timer-active" : ""}`}
          >
            <div className="eyebrow">
              <Timer size={15} />
              REST & RESET
            </div>
            <div
              className="rest-circle"
              style={{
                background: `conic-gradient(var(--accent) ${w.restDuration ? (remaining / w.restDuration) * 360 : 0}deg, var(--line) 0deg)`,
              }}
            >
              <div>
                <strong>{timeText(remaining)}</strong>
                <span>
                  {w.restUntil
                    ? remaining
                      ? "Breathe. Get ready."
                      : "Ready for your next set"
                    : "Complete a set to start"}
                </span>
              </div>
            </div>
            <div className="rest-controls">
              <button
                className="button secondary"
                onClick={() =>
                  update({
                    ...w,
                    restUntil: Math.max(now, w.restUntil || now) + 30000,
                    restDuration: Math.max(remaining, 0) + 30,
                  })
                }
              >
                <Plus size={15} />
                30 sec
              </button>
              <button
                className="button secondary"
                disabled={!w.restUntil}
                onClick={() =>
                  update({ ...w, restUntil: null, restDuration: 0 })
                }
              >
                <SkipForward size={15} />
                Skip
              </button>
            </div>
          </section>
          <div className="session-tip">
            <span className="eyebrow">A NOTE ON PROGRESS</span>
            <p>
              Your previous set is a reference, not a requirement. Good form
              comes first.
            </p>
          </div>
        </aside>
      </div>
      <div className="workout-dock">
        <div className="mobile-rest">
          <Timer size={17} />
          <strong>{w.restUntil ? timeText(remaining) : "Rest timer"}</strong>
          <button
            aria-label="Add 30 seconds rest"
            className="icon-button"
            onClick={() =>
              update({
                ...w,
                restUntil: Math.max(now, w.restUntil || now) + 30000,
                restDuration: Math.max(remaining, 0) + 30,
              })
            }
          >
            +30
          </button>
          {w.restUntil && (
            <button
              className="icon-button"
              aria-label="Skip rest"
              onClick={() => update({ ...w, restUntil: null, restDuration: 0 })}
            >
              <SkipForward size={17} />
            </button>
          )}
        </div>
        <span className="dock-count">
          {count} of {total} sets completed
        </span>
        <button
          className="button lime"
          disabled={!count}
          onClick={() => setConfirm("finish")}
        >
          Finish workout
          <Check size={18} />
        </button>
      </div>
      {confirm && (
        <Confirm
          title={
            confirm === "finish" ? "Finish strong?" : "Discard this workout?"
          }
          label={confirm === "finish" ? "Finish workout" : "Discard workout"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === "finish") {
              const finished = {
                ...w,
                endedAt: new Date().toISOString(),
                restUntil: null,
                restDuration: 0,
              };
              setData((d) => ({
                ...d,
                active: null,
                workouts: [...d.workouts, finished],
              }));
              onFinish(finished);
            } else {
              setData((d) => ({ ...d, active: null }));
              notice("Workout discarded");
              onLeave();
            }
          }}
        >
          {confirm === "finish"
            ? `${count} completed sets will be saved. Incomplete sets stay visible in the breakdown but do not count toward volume or records.`
            : "Your in-progress sets will be removed. This cannot be undone."}
        </Confirm>
      )}
    </>
  );
}
export function WorkoutSummary({
  workout,
  onClose,
}: {
  workout: Workout;
  onClose: () => void;
}) {
  const { data } = useStore();
  const prs = newRecords(
    workout,
    data.workouts.filter(
      (w) => w.id !== workout.id && w.startedAt < workout.startedAt,
    ),
    data.exercises,
  );
  return (
    <Modal title="That's another one in the books." onClose={onClose}>
      <div className="summary-hero">
        <span>
          <Check size={32} />
        </span>
        <div className="eyebrow">WORKOUT COMPLETE</div>
        <h2>{workout.name}</h2>
        <p>You showed up. That's what builds strength.</p>
      </div>
      <div className="mini-stats">
        <div>
          <span>Duration</span>
          <strong>{duration(workout)}</strong>
          <small>minutes</small>
        </div>
        <div>
          <span>Volume</span>
          <strong>
            {fmt(displayWeight(volume(workout), data.profile.units))}
          </strong>
          <small>{data.profile.units}</small>
        </div>
        <div>
          <span>Sets</span>
          <strong>{completedSets(workout)}</strong>
          <small>completed</small>
        </div>
      </div>
      {prs.length > 0 && (
        <div className="summary-records">
          <h3>
            <Trophy size={19} />
            {prs.length} personal {prs.length === 1 ? "record" : "records"}
          </h3>
          {prs.map((r) => (
            <div key={`${r.exerciseId}-${r.kind}`}>
              <span>
                {r.name}
                <small>
                  {r.kind === "weight"
                    ? "Heaviest lift"
                    : r.kind === "e1rm"
                      ? "Estimated 1RM"
                      : "Best set volume"}
                </small>
              </span>
              <b>
                {fmt(displayWeight(r.value, data.profile.units))}{" "}
                {data.profile.units}
                {r.kind === "volume" ? "·reps" : ""}
              </b>
            </div>
          ))}
        </div>
      )}
      <button className="button lime full-width" onClick={onClose}>
        Keep the momentum
        <ArrowRight size={17} />
      </button>
    </Modal>
  );
}
