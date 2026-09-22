import { useEffect, useState } from "react";
import {
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  History as HistoryIcon,
  ChartNoAxesCombined,
  Ruler,
  Settings as SettingsIcon,
  ArrowUpRight,
  ChevronRight,
  Play,
  Utensils,
  Target,
} from "lucide-react";
import { useStore } from "./store";
import { Dashboard } from "./pages/Dashboard";
import { Routines } from "./pages/Routines";
import { Exercises } from "./pages/Exercises";
import { History, WorkoutDetail } from "./pages/History";
import { Progress } from "./pages/Progress";
import { Measurements } from "./pages/Measurements";
import { Settings } from "./pages/Settings";
import { LiveWorkout, WorkoutSummary } from "./pages/Workout";
import { Nutrition } from "./pages/Nutrition";
import { Goals } from "./pages/Goals";
import { Reminders } from "./components/Reminders";
import { Onboarding } from "./components/Onboarding";
import { startWorkout } from "./domain";
import type { Page, Routine, Workout } from "./model";
const pages: Page[] = [
  "Dashboard",
  "Routines",
  "Exercises",
  "History",
  "Progress",
  "Measurements",
  "Nutrition",
  "Goals",
  "Settings",
  "Workout",
];
const readPage = (): Page =>
  pages.find((p) => p.toLowerCase() === location.hash.slice(1)) || "Dashboard";
export default function App() {
  const { data, setData, notice, storageError } = useStore();
  const [page, setPage] = useState<Page>(readPage);
  const [onboard, setOnboard] = useState(!data.profile.onboarded);
  const [detail, setDetail] = useState<Workout | null>(null);
  const [summary, setSummary] = useState<Workout | null>(null);
  const navigate = (p: Page) => {
    location.hash = p.toLowerCase();
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const handler = () => setPage(readPage());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.title = `${page === "Workout" ? data.active?.name || "Workout" : page} · IronLog`;
  }, [page, data.active?.name]);
  useEffect(() => {
    if (!data.profile.onboarded) setOnboard(true);
  }, [data.profile.onboarded]);
  const start = (r: Routine) => {
    if (data.active) {
      notice(
        "Resuming your active session. Finish or discard it before starting another.",
      );
      navigate("Workout");
      return;
    }
    setData((d) => ({ ...d, active: startWorkout(r, d.workouts) }));
    navigate("Workout");
  };
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "ironlog_navigate",
            title: "Open IronLog section",
            description:
              "Navigate to an IronLog section. This does not start or complete a workout.",
            inputSchema: {
              type: "object",
              properties: { page: { type: "string", enum: pages } },
              required: ["page"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (input: unknown) => {
              const value = input as { page?: Page };
              if (!value || !pages.includes(value.page as Page))
                throw new Error("Unknown section");
              navigate(value.page!);
              return { page: value.page };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Browser support is optional. */
    }
    return () => lifecycle.abort();
  }, []);
  const nav = [
    ["Dashboard", LayoutDashboard],
    ["Routines", ListChecks],
    ["Exercises", Dumbbell],
    ["History", HistoryIcon],
    ["Progress", ChartNoAxesCombined],
    ["Measurements", Ruler],
    ["Nutrition", Utensils],
    ["Goals", Target],
  ] as const;
  return (
    <div className={`app-shell ${page === "Workout" ? "is-workout" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          href="#dashboard"
          className="brand"
          onClick={() => navigate("Dashboard")}
        >
          <span>
            <Dumbbell size={23} />
          </span>
          ironlog<span className="brand-period">.</span>
        </a>
        <div className="nav-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([p, Icon]) => (
            <button
              key={p}
              aria-current={page === p ? "page" : undefined}
              onClick={() => navigate(p)}
              className={page === p ? "selected" : ""}
            >
              <Icon size={20} />
              {p}
              {page === p && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="live-dot" /> YOUR STRENGTH. YOUR DATA.
            <p>
              Saved on this device.
              <br />
              Always yours.
            </p>
            <ArrowUpRight size={18} />
          </div>
          <button
            className={`settings-nav ${page === "Settings" ? "selected" : ""}`}
            onClick={() => navigate("Settings")}
          >
            <SettingsIcon size={19} />
            Settings
          </button>
          <button className="profile" onClick={() => navigate("Settings")}>
            <span className="avatar">
              {data.profile.name.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{data.profile.name}</strong>
              <small>{data.profile.experience} lifter</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <main id="main-content">
        <div className="topbar">
          <span>
            MY TRAINING <ChevronRight size={14} /> <b>{page}</b>
          </span>
          <div className="topbar-actions">
            <span className="saved-indicator">
              <span />
              {storageError
                ? "Storage needs attention"
                : "Saved on this device"}
            </span>
            <button
              className="icon-button"
              aria-label="Open settings"
              onClick={() => navigate("Settings")}
            >
              <SettingsIcon size={18} />
            </button>
          </div>
        </div>
        <div className="page-content">
          <Reminders navigate={navigate} />
          {storageError && (
            <div className="error storage-error" role="alert">
              {storageError}
            </div>
          )}
          {data.active && page !== "Workout" && (
            <button
              className="resume-banner"
              onClick={() => navigate("Workout")}
            >
              <span className="live-dot" />
              <strong>{data.active.name}</strong>
              <span>Workout in progress</span>
              <b>
                Resume <Play size={14} />
              </b>
            </button>
          )}
          {page === "Dashboard" && (
            <Dashboard
              navigate={navigate}
              start={start}
              openWorkout={setDetail}
            />
          )}{" "}
          {page === "Routines" && <Routines start={start} />}{" "}
          {page === "Exercises" && <Exercises openWorkout={setDetail} />}{" "}
          {page === "History" && <History openWorkout={setDetail} />}{" "}
          {page === "Progress" && <Progress />}{" "}
          {page === "Measurements" && <Measurements />}
          {page === "Nutrition" && (
            <Nutrition openGoals={() => navigate("Goals")} />
          )}
          {page === "Goals" && <Goals />}{" "}
          {page === "Settings" && (
            <Settings onOnboard={() => setOnboard(true)} />
          )}{" "}
          {page === "Workout" && (
            <LiveWorkout
              onLeave={() => navigate("Routines")}
              onFinish={(w) => {
                navigate("Dashboard");
                setSummary(w);
              }}
            />
          )}
        </div>
      </main>
      {onboard && <Onboarding onClose={() => setOnboard(false)} />}{" "}
      {detail && (
        <WorkoutDetail workout={detail} onClose={() => setDetail(null)} />
      )}{" "}
      {summary && (
        <WorkoutSummary workout={summary} onClose={() => setSummary(null)} />
      )}
    </div>
  );
}
