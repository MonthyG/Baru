import { useState } from "react";
import { TrendingUp, Trophy, Dumbbell } from "lucide-react";
import { useStore } from "../store";
import {
  addDays,
  displayWeight,
  e1rm,
  fmt,
  records,
  volume,
  weekStart,
} from "../domain";
import { muscles } from "../model";
import { Chart, Empty, PageHeader, SectionTitle } from "../components/ui";
export function Progress() {
  const { data } = useStore();
  const [weeks, setWeeks] = useState(12);
  const trained = data.exercises.filter((e) =>
    data.workouts.some((w) =>
      w.items.some((i) => i.exerciseId === e.id && i.sets.some((s) => s.done)),
    ),
  );
  const [exerciseId, setExerciseId] = useState(
    trained[0]?.id || data.exercises[0]?.id || "",
  );
  const [metric, setMetric] = useState<"e1rm" | "weight">("e1rm");
  const start = addDays(weekStart(), -(weeks - 1) * 7);
  const activity = data.workouts.filter((w) => new Date(w.startedAt) >= start);
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const d = addDays(start, i * 7);
    const workouts = activity.filter(
      (w) =>
        new Date(w.startedAt) >= d && new Date(w.startedAt) < addDays(d, 7),
    );
    return {
      label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      volume: displayWeight(
        workouts.reduce((n, w) => n + volume(w), 0),
        data.profile.units,
      ),
      count: workouts.length,
    };
  });
  const split = muscles
    .map((m) => ({
      name: m,
      value: activity.reduce(
        (n, w) =>
          n +
          w.items
            .filter(
              (i) =>
                data.exercises.find((e) => e.id === i.exerciseId)?.muscle === m,
            )
            .reduce(
              (sum, i) =>
                sum +
                i.sets
                  .filter((s) => s.done)
                  .reduce((a, s) => a + s.weight * s.reps, 0),
              0,
            ),
        0,
      ),
    }))
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = split.reduce((n, x) => n + x.value, 0);
  const progression = [...activity]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .filter((w) =>
      w.items.some(
        (i) =>
          i.exerciseId === exerciseId &&
          i.sets.some((s) => s.done && s.type !== "warmup"),
      ),
    )
    .map((w) => ({
      label: new Date(w.startedAt).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      value: displayWeight(
        Math.max(
          0,
          ...w.items
            .filter((i) => i.exerciseId === exerciseId)
            .flatMap((i) =>
              i.sets
                .filter((s) => s.done && s.type !== "warmup")
                .map((s) => (metric === "e1rm" ? e1rm(s) : s.weight)),
            ),
        ),
        data.profile.units,
      ),
    }));
  return (
    <>
      <PageHeader
        eyebrow="THE BIGGER PICTURE"
        title="Stronger, over time."
        description="Your effort, made visible. Every chart comes from your log."
        action={
          <select
            className="control range-select"
            aria-label="Analytics period"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
          >
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
            <option value={26}>Last 26 weeks</option>
            <option value={52}>Last 52 weeks</option>
          </select>
        }
      />
      <div className="stat-grid">
        <div className="card stat">
          <span className="stat-label">
            Total volume <TrendingUp size={19} />
          </span>
          <strong>
            {fmt(displayWeight(total, data.profile.units))}
            <small> {data.profile.units}</small>
          </strong>
          <span className="stat-note">Across the selected period</span>
        </div>
        <div className="card stat">
          <span className="stat-label">
            Workouts <Dumbbell size={19} />
          </span>
          <strong>
            {activity.length}
            <small> sessions</small>
          </strong>
          <span className="stat-note">
            {(activity.length / weeks).toFixed(1)} per week on average
          </span>
        </div>
        <div className="card stat">
          <span className="stat-label">
            Movements trained <Trophy size={19} />
          </span>
          <strong>
            {
              new Set(
                activity.flatMap((w) =>
                  w.items
                    .filter((i) => i.sets.some((s) => s.done))
                    .map((i) => i.exerciseId),
                ),
              ).size
            }
          </strong>
          <span className="stat-note">A balanced foundation</span>
        </div>
      </div>
      <div className="analytics-grid">
        <section className="card">
          <SectionTitle title="Volume over time" />
          <Chart
            data={weekly.map((w) => ({ label: w.label, value: w.volume }))}
            label="Weekly volume"
            unit={data.profile.units}
          />
        </section>
        <section className="card">
          <SectionTitle title="Workouts per week" />
          <Chart
            data={weekly.map((w) => ({ label: w.label, value: w.count }))}
            label="Workouts"
            bars
          />
        </section>
        <section className="card">
          <SectionTitle title="Volume by muscle group" />
          <p className="help muted">
            Each set is attributed to its primary muscle.
          </p>
          <div className="muscle-split">
            {split.map((m, i) => (
              <div key={m.name}>
                <div>
                  <span>{m.name}</span>
                  <small>
                    {fmt(displayWeight(m.value, data.profile.units))}{" "}
                    {data.profile.units} · {Math.round((m.value / total) * 100)}
                    %
                  </small>
                </div>
                <div className="muscle-track">
                  <span
                    style={{
                      width: `${(m.value / total) * 100}%`,
                      background: [
                        "#92ac61",
                        "#afbe85",
                        "#708d6a",
                        "#8fa4a1",
                        "#9691ae",
                      ][i % 5],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!split.length && (
            <Empty
              title="No volume yet"
              text="Log weighted sets to see your muscle group breakdown."
            />
          )}
        </section>
        <section className="card">
          <SectionTitle title="Strength progression" />
          <div className="stack">
            <select
              className="control"
              aria-label="Progress exercise"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              {(trained.length ? trained : data.exercises).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <div className="segmented">
              <button
                className={metric === "e1rm" ? "active" : ""}
                onClick={() => setMetric("e1rm")}
              >
                Estimated 1RM
              </button>
              <button
                className={metric === "weight" ? "active" : ""}
                onClick={() => setMetric("weight")}
              >
                Best weight
              </button>
            </div>
          </div>
          {progression.length ? (
            <Chart
              data={progression}
              label={metric === "e1rm" ? "Estimated 1RM" : "Best weight"}
              unit={data.profile.units}
            />
          ) : (
            <Empty
              title="No sets in this period"
              text="Choose another exercise or a longer time range."
            />
          )}
          <p className="help muted">
            Estimated 1RM uses the Epley formula. Warm-ups are excluded;
            estimates are most useful for low-rep working sets.
          </p>
        </section>
      </div>
      <div className="spacer" />
      <SectionTitle title="Your personal records" />
      <p className="help muted">
        All-time records · Working, failure, and drop sets · Volume is weight ×
        reps for a single set.
      </p>
      <div className="card table-card">
        <div className="table-scroll">
          <table className="records-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Best weight</th>
                <th>Estimated 1RM</th>
                <th>Best set volume</th>
              </tr>
            </thead>
            <tbody>
              {trained.map((e) => {
                const r = records(data.workouts, e.id);
                return (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.name}</strong>
                      <small>{e.muscle}</small>
                    </td>
                    <td>
                      {fmt(displayWeight(r.weight, data.profile.units))}{" "}
                      {data.profile.units}
                    </td>
                    <td>
                      {fmt(displayWeight(r.e1rm, data.profile.units))}{" "}
                      {data.profile.units}
                    </td>
                    <td>
                      {fmt(displayWeight(r.volume, data.profile.units))}{" "}
                      {data.profile.units}·reps
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!trained.length && (
          <Empty
            title="Set your first benchmark"
            text="Your personal records will appear after you log a workout."
          />
        )}
      </div>
    </>
  );
}
