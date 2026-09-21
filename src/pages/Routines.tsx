import { useState } from "react";
import {
  Plus,
  Play,
  Clock3,
  Pencil,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Link2,
} from "lucide-react";
import { useStore } from "../store";
import { routineSchema, type Routine } from "../model";
import { uid } from "../domain";
import { PageHeader, Modal, Field, Confirm, Empty } from "../components/ui";
import { ExercisePicker } from "./Exercises";
export function RoutineEditor({
  routine,
  onClose,
}: {
  routine: Routine | null;
  onClose: () => void;
}) {
  const { data, setData, notice } = useStore();
  const [draft, setDraft] = useState<Routine>(
    routine || { id: uid(), name: "", description: "", items: [] },
  );
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");
  const patch = (id: string, key: string, value: string | number) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, [key]: value } : i)),
    }));
  const move = (index: number, dir: number) =>
    setDraft((d) => {
      const items = [...d.items];
      [items[index], items[index + dir]] = [items[index + dir], items[index]];
      return { ...d, items };
    });
  return (
    <>
      <Modal
        wide
        title={routine ? "Edit routine" : "Build your routine"}
        onClose={onClose}
      >
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const result = routineSchema.safeParse(draft);
            if (
              !result.success ||
              draft.items.some((i) => i.minReps > i.maxReps) ||
              !draft.items.length
            ) {
              setError(
                "Add at least one exercise and use valid sets, rep ranges, and rest times.",
              );
              return;
            }
            setData((d) => ({
              ...d,
              routines: routine
                ? d.routines.map((r) => (r.id === routine.id ? draft : r))
                : [...d.routines, draft],
            }));
            notice("Routine saved");
            onClose();
          }}
        >
          <Field label="Routine name">
            <input
              required
              maxLength={100}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Upper body strength"
            />
          </Field>
          <Field label="Description">
            <input
              maxLength={500}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="What are we working toward?"
            />
          </Field>
          <p className="muted help">
            Give exercises the same superset letter to alternate them. Rest
            after each completed set is adjustable during training.
          </p>
          <div className="routine-editor-items">
            {draft.items.map((item, index) => (
              <div className="routine-editor-item" key={item.id}>
                <div className="editor-item-head">
                  <span className="order-number">{index + 1}</span>
                  <strong>
                    {data.exercises.find((e) => e.id === item.exerciseId)?.name}
                  </strong>
                  <div className="inline-actions">
                    <button
                      aria-label="Move exercise up"
                      type="button"
                      disabled={index === 0}
                      className="icon-button"
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      aria-label="Move exercise down"
                      type="button"
                      disabled={index === draft.items.length - 1}
                      className="icon-button"
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      aria-label="Remove exercise"
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          items: draft.items.filter((i) => i.id !== item.id),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="routine-inputs">
                  <Field label="Sets">
                    <input
                      required
                      type="number"
                      min={1}
                      max={20}
                      value={item.sets}
                      onChange={(e) =>
                        patch(item.id, "sets", Number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label="Min reps">
                    <input
                      required
                      type="number"
                      min={1}
                      max={100}
                      value={item.minReps}
                      onChange={(e) =>
                        patch(item.id, "minReps", Number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label="Max reps">
                    <input
                      required
                      type="number"
                      min={item.minReps}
                      max={100}
                      value={item.maxReps}
                      onChange={(e) =>
                        patch(item.id, "maxReps", Number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label="Rest (sec)">
                    <input
                      required
                      type="number"
                      min={0}
                      max={600}
                      value={item.rest}
                      onChange={(e) =>
                        patch(item.id, "rest", Number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label="Superset">
                    <select
                      value={item.superset}
                      onChange={(e) =>
                        patch(item.id, "superset", e.target.value)
                      }
                    >
                      <option value="">None</option>
                      {["A", "B", "C", "D", "E"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => setPicker(true)}
          >
            <Plus size={17} />
            Add exercise
          </button>
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button lime" type="submit">
              Save routine
            </button>
          </div>
        </form>
      </Modal>
      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onPick={(e) => {
            setDraft((d) => ({
              ...d,
              items: [
                ...d.items,
                {
                  id: uid(),
                  exerciseId: e.id,
                  sets: 3,
                  minReps: 8,
                  maxReps: 12,
                  rest: data.profile.rest,
                  superset: "",
                },
              ],
            }));
            setPicker(false);
          }}
        />
      )}
    </>
  );
}
export function Routines({ start }: { start: (r: Routine) => void }) {
  const { data, setData, notice } = useStore();
  const [edit, setEdit] = useState<Routine | null | undefined>(undefined);
  const [remove, setRemove] = useState<Routine | null>(null);
  const move = (index: number, dir: number) =>
    setData((d) => {
      const routines = [...d.routines];
      [routines[index], routines[index + dir]] = [
        routines[index + dir],
        routines[index],
      ];
      return { ...d, routines };
    });
  return (
    <>
      <PageHeader
        eyebrow="BUILT AROUND YOU"
        title="Your routines"
        description="A little structure. A lot of progress."
        action={
          <button className="button" onClick={() => setEdit(null)}>
            <Plus size={17} />
            Create routine
          </button>
        }
      />
      <div className="routine-grid">
        {data.routines.map((r, index) => {
          const groups = [
            ...new Set(
              r.items.map(
                (i) =>
                  data.exercises.find((e) => e.id === i.exerciseId)?.muscle,
              ),
            ),
          ];
          return (
            <article className="card routine-card" key={r.id}>
              <div className="routine-card-top">
                <span
                  className={`routine-mark ${index % 3 === 1 ? "blue" : index % 3 === 2 ? "violet" : ""}`}
                >
                  <Layers size={23} />
                </span>
                <span className="eyebrow">
                  ROUTINE {String(index + 1).padStart(2, "0")}
                </span>
                <div className="inline-actions">
                  <button
                    className="icon-button"
                    aria-label={`Move ${r.name} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Move ${r.name} down`}
                    disabled={index === data.routines.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </div>
              <h2>{r.name}</h2>
              <p className="routine-description">
                {r.description || "Your own training blueprint."}
              </p>
              <div className="choice-wrap">
                {groups.map((g) => (
                  <span className="badge neutral" key={g}>
                    {g}
                  </span>
                ))}
              </div>
              <div className="routine-exercise-list">
                {r.items.map((i) => (
                  <div key={i.id}>
                    <span>
                      {data.exercises.find((e) => e.id === i.exerciseId)?.name}
                      {i.superset && (
                        <small className="superset-tag">
                          <Link2 size={11} />
                          {i.superset}
                        </small>
                      )}
                    </span>
                    <small>
                      {i.sets} × {i.minReps}–{i.maxReps}
                    </small>
                  </div>
                ))}
              </div>
              <div className="routine-duration">
                <Clock3 size={14} />
                {Math.round(
                  r.items.reduce((n, i) => n + i.sets * (40 + i.rest), 0) / 60,
                )}{" "}
                min{" "}
                <span>· {r.items.reduce((n, i) => n + i.sets, 0)} sets</span>
              </div>
              <div className="routine-card-actions">
                <button
                  className="button lime"
                  onClick={() => start(r)}
                  disabled={!r.items.length}
                >
                  <Play size={16} />
                  Start workout
                </button>
                <button
                  aria-label={`Edit ${r.name}`}
                  className="icon-button"
                  onClick={() => setEdit(r)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  aria-label={`Duplicate ${r.name}`}
                  className="icon-button"
                  onClick={() => {
                    setData((d) => ({
                      ...d,
                      routines: [
                        ...d.routines,
                        {
                          ...r,
                          id: uid(),
                          name: `${r.name.slice(0, 90)} (copy)`,
                          items: r.items.map((i) => ({ ...i, id: uid() })),
                        },
                      ],
                    }));
                    notice("Routine duplicated");
                  }}
                >
                  <Copy size={17} />
                </button>
                <button
                  aria-label={`Delete ${r.name}`}
                  className="icon-button"
                  onClick={() => setRemove(r)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!data.routines.length && (
        <Empty
          title="Your plan starts here"
          text="Add your favourite exercises and build a routine you look forward to."
          action="Create routine"
          onClick={() => setEdit(null)}
        />
      )}
      {edit !== undefined && (
        <RoutineEditor routine={edit} onClose={() => setEdit(undefined)} />
      )}
      {remove && (
        <Confirm
          title={`Delete ${remove.name}?`}
          onClose={() => setRemove(null)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              routines: d.routines.filter((r) => r.id !== remove.id),
            }));
            notice("Routine deleted");
          }}
        >
          Your logged workouts will stay in your history.
        </Confirm>
      )}
    </>
  );
}
