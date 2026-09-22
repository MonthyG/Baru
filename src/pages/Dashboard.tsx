import {
  ArrowUpRight,
  ArrowRight,
  Play,
  Flame,
  Clock3,
  Layers,
  TrendingUp,
  Trophy,
  Check,
  CalendarDays,
} from "lucide-react";
import { useStore } from "../store";
import { NutritionSummary } from "./Nutrition";
import {
  addDays,
  dayKey,
  displayWeight,
  fmt,
  nextScheduled,
  volume,
  weekStart,
  weeklyStreak,
  newRecords,
  duration,
} from "../domain";
import type { Page, Routine, Workout } from "../model";
import { Chart, Empty, PageHeader, SectionTitle } from "../components/ui";
export function Dashboard({
  navigate,
  start,
  openWorkout,
}: {
  navigate: (p: Page) => void;
  start: (r: Routine) => void;
  openWorkout: (w: Workout) => void;
}) {
  const { data } = useStore();
  const { profile, workouts } = data;
  const next = nextScheduled(data);
  const now = new Date();
  const monday = weekStart();
  const week = workouts.filter((w) => new Date(w.startedAt) >= monday);
  const last = workouts.filter(
    (w) =>
      new Date(w.startedAt) >= addDays(monday, -7) &&
      new Date(w.startedAt) < monday,
  );
  const total = week.reduce((n, w) => n + volume(w), 0);
  const previous = last.reduce((n, w) => n + volume(w), 0);
  const delta = previous ? ((total - previous) / previous) * 100 : null;
  const recent = [...workouts].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );
  const prs = recent
    .slice(0, 8)
    .flatMap((w) =>
      newRecords(
        w,
        workouts.filter((p) => p.startedAt < w.startedAt),
        data.exercises,
      )
        .filter((r) => r.kind === "weight")
        .map((r) => ({ ...r, date: w.startedAt })),
    )
    .slice(0, 3);
  const chart = Array.from({ length: 8 }, (_, i) => {
    const date = addDays(monday, -(7 - i) * 7);
    return {
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: Math.round(
        displayWeight(
          workouts
            .filter(
              (w) =>
                new Date(w.startedAt) >= date &&
                new Date(w.startedAt) < addDays(date, 7),
            )
            .reduce((n, w) => n + volume(w), 0),
          profile.units,
        ),
      ),
    };
  });
  return (
    <>
      <PageHeader
        eyebrow="YOUR TRAINING, AT A GLANCE"
        title={`Let's get stronger, ${profile.name.split(" ")[0]}.`}
        description="Small steps. Heavy lifts. Lasting progress."
        action={
          <span className="date-pill">
            <CalendarDays size={16} />
            {now.toLocaleDateString("en", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        }
      />
      <div className="dashboard-top">
        <section className="next-card">
          <div className="next-copy">
            <div className="eyebrow">
              <span className="live-dot" />{" "}
              {data.active ? "WORKOUT IN PROGRESS" : "UP NEXT"}
            </div>
            <h2>
              {data.active?.name || next.routine?.name || "Your next chapter"}
            </h2>
            <p>
              {next.routine?.description ||
                "Build a routine that fits the way you train."}
            </p>
            <div className="next-meta">
              <span>
                <Layers size={15} />
                {next.routine?.items.length || 0} exercises
              </span>
              <span>
                <Clock3 size={15} />
                {next.routine
                  ? Math.round(
                      next.routine.items.reduce(
                        (n, i) => n + i.sets * (40 + i.rest),
                        0,
                      ) / 60,
                    )
                  : 0}
                –
                {next.routine
                  ? Math.round(
                      next.routine.items.reduce(
                        (n, i) => n + i.sets * (40 + i.rest),
                        0,
                      ) / 60,
                    ) + 5
                  : 0}{" "}
                min
              </span>
            </div>
            <button
              className="button lime"
              onClick={() =>
                data.active
                  ? navigate("Workout")
                  : next.routine
                    ? start(next.routine)
                    : navigate("Routines")
              }
            >
              <Play size={17} fill="currentColor" />
              {data.active
                ? "Resume workout"
                : next.routine
                  ? "Start workout"
                  : "Create routine"}
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="weight-art" aria-hidden="true">
            <div className="plate p1" />
            <div className="plate p2" />
            <div className="plate p3" />
            <div className="bar" />
            <div className="plate p4" />
            <div className="plate p5" />
            <div className="plate p6" />
            <span>
              IRONLOG
              <br />
              <b>20</b>
              <small>KEEP SHOWING UP</small>
            </span>
          </div>
          <div className="next-bottom">
            <span>YOUR NEXT SESSION</span>
            <span>
              {next.date.toLocaleDateString("en", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              <ArrowUpRight size={14} />
            </span>
          </div>
        </section>
        <section className="card week-card">
          <SectionTitle title="This week" />
          <div className="week-total">
            <strong>
              {week.length}
              <span> / {profile.days}</span>
            </strong>
            <span>workouts completed</span>
          </div>
          <div className="calendar-strip">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(monday, i);
              const trained = week.some(
                (w) => dayKey(w.startedAt) === dayKey(d),
              );
              return (
                <div
                  key={i}
                  className={`day ${dayKey(d) === dayKey(now) ? "today" : ""}`}
                >
                  <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                  <div className={trained ? "trained" : ""}>
                    {trained ? <Check size={17} /> : d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="week-footer">
            <span className="dot-key" /> Workout logged{" "}
            <span className="week-goal">
              {week.length >= profile.days
                ? "Weekly goal reached"
                : `${Math.max(0, profile.days - week.length)} to your weekly goal`}
            </span>
          </div>
        </section>
      </div>
      <div className="stat-grid">
        <div className="card stat">
          <span className="stat-label">
            Training streak <Flame size={19} />
          </span>
          <strong>
            {weeklyStreak(workouts)}
            <small> weeks</small>
          </strong>
          <span className="stat-note">
            {weeklyStreak(workouts)
              ? "Consistency looks good on you."
              : "Your first session starts the streak."}
          </span>
        </div>
        <div className="card stat">
          <span className="stat-label">
            Weekly volume <Layers size={19} />
          </span>
          <strong>
            {fmt(displayWeight(total, profile.units))}
            <small> {profile.units}</small>
          </strong>
          <span className="stat-note">
            <span className={delta !== null && delta >= 0 ? "positive" : ""}>
              {delta === null
                ? "No prior week"
                : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
            </span>{" "}
            {delta === null ? "to compare yet" : "vs. last week"}
          </span>
        </div>
        <div className="card stat">
          <span className="stat-label">
            Total workouts <TrendingUp size={19} />
          </span>
          <strong>
            {workouts.length}
            <small> sessions</small>
          </strong>
          <span className="stat-note">Every session adds up.</span>
        </div>
      </div>
      <SectionTitle
        title="Today's fuel"
        action="Food log"
        onClick={() => navigate("Nutrition")}
      />
      <NutritionSummary />
      <div className="dashboard-bottom">
        <section className="card">
          <SectionTitle
            title="Your work is adding up"
            action="View progress"
            onClick={() => navigate("Progress")}
          />
          <div className="chart-heading">
            <span className="muted">Training volume</span>
            <span className="chip">Last 8 weeks · {profile.units}</span>
          </div>
          <Chart data={chart} />
          <div className="chart-caption">
            <span className="dot-key" /> Total weekly volume
          </div>
        </section>
        <section className="card">
          <SectionTitle
            title="Recent records"
            action="View all"
            onClick={() => navigate("Progress")}
          />
          {prs.length ? (
            prs.map((r, i) => (
              <div key={`${r.exerciseId}-${i}`} className="record-row">
                <span className="record-icon">
                  <Trophy size={19} />
                </span>
                <div>
                  <strong>{r.name}</strong>
                  <p>
                    Heaviest lift ·{" "}
                    {new Date(r.date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <b>
                  {fmt(displayWeight(r.value, profile.units))}
                  <small> {profile.units}</small>
                </b>
              </div>
            ))
          ) : (
            <Empty
              title="Your first record is waiting"
              text="Complete a working set to set your starting benchmark."
            />
          )}
          <div className="record-footer">
            A little stronger than yesterday.
            <ArrowUpRight size={17} />
          </div>
        </section>
      </div>
      <SectionTitle
        title="Recently logged"
        action="All history"
        onClick={() => navigate("History")}
      />
      <div className="recent-grid">
        {recent.slice(0, 3).map((w) => (
          <button
            key={w.id}
            className="card recent-card"
            onClick={() => openWorkout(w)}
          >
            <div
              className={`routine-mark ${w.routineId === "legs" ? "violet" : w.routineId === "pull" ? "blue" : ""}`}
            >
              <Layers size={20} />
            </div>
            <div>
              <strong>{w.name}</strong>
              <p>
                {new Date(w.startedAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {duration(w)} min ·{" "}
                {fmt(displayWeight(volume(w), profile.units))} {profile.units}
              </p>
            </div>
            <ArrowUpRight size={17} />
          </button>
        ))}
      </div>
      {!recent.length && (
        <Empty
          title="Make your first entry"
          text="Start a workout and your training story will appear here."
        />
      )}
    </>
  );
}
