import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { dayKey, displayWeight, fmt, toKg, uid, addDays } from "../domain";
import { measurementSchema, type Measurement } from "../model";
import { bmi } from "../wellness";
import { BmiCard } from "../components/BmiCard";
import {
  Chart,
  Confirm,
  Empty,
  Field,
  Modal,
  PageHeader,
  SectionTitle,
} from "../components/ui";
function WeightForm({
  measurement,
  onClose,
}: {
  measurement: Measurement | null;
  onClose: () => void;
}) {
  const { data, setData, notice } = useStore();
  const [date, setDate] = useState(measurement?.date || dayKey());
  const [weight, setWeight] = useState(
    measurement
      ? String(displayWeight(measurement.weight, data.profile.units))
      : "",
  );
  const [error, setError] = useState("");
  return (
    <Modal
      title={measurement ? "Edit bodyweight" : "Log your bodyweight"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const result = measurementSchema.safeParse({
            ...measurement,
            id: measurement?.id || uid(),
            date,
            weight: toKg(Number(weight), data.profile.units),
            height: measurement?.height ?? data.profile.height,
            waist: measurement?.waist || 0,
            chest: measurement?.chest || 0,
            hips: measurement?.hips || 0,
            arm: measurement?.arm || 0,
          });
          if (
            !result.success ||
            date > dayKey() ||
            !date ||
            new Date(date).toISOString().slice(0, 10) !== date
          ) {
            setError(
              "Enter a valid past date and a bodyweight between 20 and 500 kg equivalent.",
            );
            return;
          }
          if (
            data.measurements.some(
              (m) => m.id !== measurement?.id && m.date === date,
            )
          ) {
            setError(
              "A weight is already logged for this date. Edit that entry instead.",
            );
            return;
          }
          setData((d) => ({
            ...d,
            measurements: measurement
              ? d.measurements.map((m) =>
                  m.id === measurement.id ? result.data : m,
                )
              : [...d.measurements, result.data],
          }));
          notice("Bodyweight saved");
          onClose();
        }}
      >
        <Field label="Date">
          <input
            required
            type="date"
            max={dayKey()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label={`Bodyweight (${data.profile.units})`}>
          <input
            autoFocus
            required
            type="number"
            inputMode="decimal"
            min={displayWeight(20, data.profile.units)}
            max={displayWeight(500, data.profile.units)}
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
        <p className="help muted">
          BMI uses the height saved with this check-in. Update your current
          height and age in Settings before logging a new entry.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button lime" type="submit">
          Save check-in
        </button>
      </form>
    </Modal>
  );
}
export function Measurements() {
  const { data, setData, notice } = useStore();
  const [edit, setEdit] = useState<Measurement | null | undefined>();
  const [remove, setRemove] = useState<Measurement | null>(null);
  const sorted = [...data.measurements].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const latest = sorted.at(-1);
  const change = (days: number) => {
    const prior = [...sorted]
      .reverse()
      .find((m) => m.date <= dayKey(addDays(new Date(), -days)));
    return latest && prior && latest.id !== prior.id
      ? displayWeight(latest.weight - prior.weight, data.profile.units)
      : null;
  };
  const bmiPoints = sorted
    .filter((m) => m.height !== null)
    .map((m) => ({
      label: new Date(`${m.date}T12:00:00`).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      value: bmi(m.weight, m.height)!,
    }));
  return (
    <>
      <PageHeader
        eyebrow="YOUR STARTING POINT, YOUR PROGRESS"
        title="Bodyweight & BMI"
        description="A simple check-in. A clearer picture over time."
        action={
          <button className="button" onClick={() => setEdit(null)}>
            <Plus size={17} />
            Log bodyweight
          </button>
        }
      />
      <div className="stat-grid">
        <section className="card stat">
          <span className="stat-label">Latest bodyweight</span>
          <strong>
            {latest
              ? fmt(displayWeight(latest.weight, data.profile.units))
              : "—"}
            <small> {data.profile.units}</small>
          </strong>
          <span className="stat-note">
            {latest?.date || "No weigh-ins yet"}
          </span>
        </section>
        {[30, 90].map((days) => (
          <section className="card stat" key={days}>
            <span className="stat-label">{days}-day change</span>
            <strong>
              {change(days) === null
                ? "—"
                : `${change(days)! > 0 ? "+" : ""}${fmt(change(days)!)}`}
              <small> {data.profile.units}</small>
            </strong>
            <span className="stat-note">
              {change(days) === null
                ? "Not enough history yet"
                : `Compared with a check-in ${days}+ days ago`}
            </span>
          </section>
        ))}
      </div>
      <div className="analytics-grid">
        <BmiCard
          weight={latest?.weight}
          height={latest?.height ?? data.profile.height}
          age={data.profile.age}
        />
        <section className="card">
          <SectionTitle title="BMI over time" />
          {bmiPoints.length ? (
            <Chart data={bmiPoints} label="BMI" />
          ) : (
            <Empty
              title="Your BMI story starts here"
              text="Add your height in Settings and log bodyweight to track BMI over time."
            />
          )}
          <p className="help muted">
            Historical points keep the height entered at that time. BMI is one
            view of progress; your training and how you feel also matter.
          </p>
        </section>
      </div>
      <section className="card mt">
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
            text="Your first weigh-in becomes your own starting point."
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
                <th>BMI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{fmt(displayWeight(m.weight, data.profile.units))}</td>
                  <td>
                    {bmi(m.weight, m.height) === null
                      ? "—"
                      : fmt(bmi(m.weight, m.height)!)}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Edit weight ${m.date}`}
                      onClick={() => setEdit(m)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete weight ${m.date}`}
                      onClick={() => setRemove(m)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sorted.length && (
          <Empty
            title="No weigh-ins yet"
            text="Only your own entries will appear here."
          />
        )}
      </div>
      {edit !== undefined && (
        <WeightForm measurement={edit} onClose={() => setEdit(undefined)} />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete this weigh-in?"
          onClose={() => setRemove(null)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              measurements: d.measurements.filter((m) => m.id !== remove.id),
            }));
            notice("Weigh-in deleted");
          }}
        >
          This removes your bodyweight and BMI entry for {remove.date}.
        </Confirm>
      )}
    </>
  );
}
