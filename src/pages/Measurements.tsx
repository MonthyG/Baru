import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { dayKey, displayWeight, fmt, toKg, uid, addDays } from "../domain";
import { measurementSchema, type Measurement } from "../model";
import {
  Chart,
  Confirm,
  Empty,
  Field,
  Modal,
  PageHeader,
  SectionTitle,
} from "../components/ui";
function MeasurementForm({
  measurement,
  onClose,
}: {
  measurement: Measurement | null;
  onClose: () => void;
}) {
  const { data, setData, notice } = useStore();
  const units = data.profile.units;
  const [date, setDate] = useState(measurement?.date || dayKey());
  const [weight, setWeight] = useState(
    measurement ? String(displayWeight(measurement.weight, units)) : "",
  );
  const [fields, setFields] = useState(
    Object.fromEntries(
      (["waist", "chest", "hips", "arm"] as const).map((k) => [
        k,
        measurement?.[k]
          ? String(
              Math.round((measurement[k] / (units === "lb" ? 2.54 : 1)) * 10) /
                10,
            )
          : "",
      ]),
    ),
  );
  const [error, setError] = useState("");
  return (
    <Modal
      title={measurement ? "Edit measurement" : "Check in with yourself"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const draft = {
            id: measurement?.id || uid(),
            date,
            weight: toKg(Number(weight), units),
            ...Object.fromEntries(
              Object.entries(fields).map(([k, v]) => [
                k,
                Number(v) * (units === "lb" ? 2.54 : 1),
              ]),
            ),
          };
          const parsed = measurementSchema.safeParse(draft);
          if (!parsed.success || date > dayKey() || isNaN(Date.parse(date))) {
            setError(
              "Enter a valid date and bodyweight (20–500 kg equivalent). Measurements must be nonnegative.",
            );
            return;
          }
          if (
            data.measurements.some(
              (m) => m.id !== measurement?.id && m.date === date,
            )
          ) {
            setError(
              "A check-in already exists on this date. Edit that entry or choose a different date.",
            );
            return;
          }
          setData((d) => ({
            ...d,
            measurements: measurement
              ? d.measurements.map((m) =>
                  m.id === measurement.id ? parsed.data : m,
                )
              : [...d.measurements, parsed.data],
          }));
          notice("Check-in saved");
          onClose();
        }}
      >
        <div className="form-grid">
          <Field label="Date">
            <input
              type="date"
              required
              max={dayKey()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label={`Bodyweight (${units})`}>
            <input
              type="number"
              inputMode="decimal"
              required
              min={displayWeight(20, units)}
              max={displayWeight(500, units)}
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
        </div>
        <p className="help muted">
          Optional measurements · {units === "lb" ? "inches" : "centimetres"}
        </p>
        <div className="form-grid">
          {Object.entries(fields).map(([key, value]) => (
            <Field
              label={`${key[0].toUpperCase() + key.slice(1)} (${units === "lb" ? "in" : "cm"})`}
              key={key}
            >
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={units === "lb" ? 118 : 300}
                step="0.1"
                value={value}
                onChange={(e) =>
                  setFields({ ...fields, [key]: e.target.value })
                }
              />
            </Field>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <button className="button lime" type="submit">
          Save check-in
        </button>
      </form>
    </Modal>
  );
}
export function Measurements() {
  const { data, setData, notice } = useStore();
  const [edit, setEdit] = useState<Measurement | null | undefined>(undefined);
  const [remove, setRemove] = useState<Measurement | null>(null);
  const sorted = [...data.measurements].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const latest = sorted.at(-1);
  const change = (days: number) => {
    if (!latest) return null;
    const target = dayKey(addDays(new Date(), -days));
    const prior = [...sorted].reverse().find((m) => m.date <= target);
    return prior && prior.id !== latest.id
      ? displayWeight(latest.weight - prior.weight, data.profile.units)
      : null;
  };
  return (
    <>
      <PageHeader
        eyebrow="BEYOND THE BARBELL"
        title="Body measurements"
        description="Another perspective on your progress."
        action={
          <button className="button" onClick={() => setEdit(null)}>
            <Plus size={17} />
            Log check-in
          </button>
        }
      />
      <div className="stat-grid">
        <div className="card stat">
          <span className="stat-label">Latest bodyweight</span>
          <strong>
            {latest
              ? fmt(displayWeight(latest.weight, data.profile.units))
              : "—"}
            <small> {data.profile.units}</small>
          </strong>
          <span className="stat-note">
            {latest
              ? new Date(`${latest.date}T12:00:00`).toLocaleDateString("en", {
                  month: "long",
                  day: "numeric",
                })
              : "Log your first check-in"}
          </span>
        </div>
        {[30, 90].map((days) => {
          const n = change(days);
          return (
            <div className="card stat" key={days}>
              <span className="stat-label">{days}-day change</span>
              <strong>
                {n === null ? "—" : `${n > 0 ? "+" : ""}${fmt(n)}`}
                <small> {data.profile.units}</small>
              </strong>
              <span className="stat-note">
                {n === null
                  ? "Not enough history yet"
                  : `From the latest entry on or before ${days} days ago`}
              </span>
            </div>
          );
        })}
      </div>
      <section className="card">
        <SectionTitle title="Bodyweight over time" />
        {sorted.length ? (
          <Chart
            data={sorted.map((m) => ({
              label: new Date(`${m.date}T12:00:00`).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              }),
              value: displayWeight(m.weight, data.profile.units),
            }))}
            label="Bodyweight"
            unit={data.profile.units}
          />
        ) : (
          <Empty
            title="Start with where you are"
            text="Your check-ins will build a picture of change over time."
          />
        )}
      </section>
      <div className="spacer" />
      <SectionTitle title="Your check-ins" />
      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bodyweight ({data.profile.units})</th>
                {["Waist", "Chest", "Hips", "Arm"].map((k) => (
                  <th key={k}>
                    {k} ({data.profile.units === "lb" ? "in" : "cm"})
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((m) => (
                <tr key={m.id}>
                  <td>
                    {new Date(`${m.date}T12:00:00`).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td>{fmt(displayWeight(m.weight, data.profile.units))}</td>
                  {(["waist", "chest", "hips", "arm"] as const).map((k) => (
                    <td key={k}>
                      {m[k]
                        ? fmt(m[k] / (data.profile.units === "lb" ? 2.54 : 1))
                        : "—"}
                    </td>
                  ))}
                  <td>
                    <button
                      aria-label={`Edit measurement ${m.date}`}
                      className="icon-button"
                      onClick={() => setEdit(m)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      aria-label={`Delete measurement ${m.date}`}
                      className="icon-button"
                      onClick={() => setRemove(m)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sorted.length && (
          <Empty
            title="No check-ins yet"
            text="Add your first entry whenever you're ready."
          />
        )}
      </div>
      {edit !== undefined && (
        <MeasurementForm
          measurement={edit}
          onClose={() => setEdit(undefined)}
        />
      )}
      {remove && (
        <Confirm
          title="Delete this check-in?"
          onClose={() => setRemove(null)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              measurements: d.measurements.filter((m) => m.id !== remove.id),
            }));
            notice("Check-in deleted");
          }}
        >
          The entry for {remove.date} will be permanently removed.
        </Confirm>
      )}
    </>
  );
}
