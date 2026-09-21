import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  ArrowUpRight,
} from "lucide-react";
import { allowStorageRecovery, useStore } from "../store";
import {
  dataSchema,
  equipment,
  profileSchema,
  type Data,
  type Profile,
} from "../model";
import { seed } from "../seed";
import { Confirm, Field, PageHeader, SectionTitle } from "../components/ui";
export function ProfileFields({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  return (
    <>
      <div className="form-grid">
        <Field label="Your name">
          <input
            required
            minLength={1}
            maxLength={100}
            value={profile.name}
            onChange={(e) => onChange({ ...profile, name: e.target.value })}
          />
        </Field>
        <Field label="Experience">
          <select
            value={profile.experience}
            onChange={(e) =>
              onChange({
                ...profile,
                experience: e.target.value as Profile["experience"],
              })
            }
          >
            {["Beginner", "Intermediate", "Advanced"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Training days per week">
          <select
            value={profile.days}
            onChange={(e) =>
              onChange({ ...profile, days: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4, 5, 6, 7].map((x) => (
              <option key={x} value={x}>
                {x} {x === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Primary goal">
          <select
            value={profile.goal}
            onChange={(e) =>
              onChange({ ...profile, goal: e.target.value as Profile["goal"] })
            }
          >
            {["Strength", "Muscle", "General fitness"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <div className="field-label">Available equipment</div>
        <div className="choice-wrap">
          {equipment.map((x) => (
            <button
              type="button"
              aria-pressed={profile.equipment.includes(x)}
              className={`choice ${profile.equipment.includes(x) ? "chosen" : ""}`}
              key={x}
              onClick={() =>
                onChange({
                  ...profile,
                  equipment: profile.equipment.includes(x)
                    ? profile.equipment.filter((e) => e !== x)
                    : [...profile.equipment, x],
                })
              }
            >
              {x}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
export function Settings({ onOnboard }: { onOnboard: () => void }) {
  const { data, setData, notice, storageError } = useStore();
  const [profile, setProfile] = useState(data.profile);
  useEffect(() => {
    setProfile((p) => ({
      ...p,
      name: data.profile.name,
      experience: data.profile.experience,
      days: data.profile.days,
      goal: data.profile.goal,
      equipment: data.profile.equipment,
    }));
  }, [
    data.profile.name,
    data.profile.experience,
    data.profile.days,
    data.profile.goal,
    data.profile.equipment.join(","),
  ]);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"reset" | "import" | null>(null);
  const [imported, setImported] = useState<Data | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const saveImmediate = (patch: Partial<Profile>) => {
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
    setProfile((p) => ({ ...p, ...patch }));
  };
  return (
    <>
      <PageHeader
        eyebrow="MAKE IT YOURS"
        title="Settings"
        description="Your training. Your preferences. Your data."
      />
      {storageError && <p className="error">{storageError}</p>}
      <div className="settings-grid">
        <section className="card">
          <SectionTitle title="Profile & training" />
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = profileSchema.safeParse(profile);
              if (!parsed.success) {
                setError(
                  "Add your name and select at least one equipment type.",
                );
                return;
              }
              setData((d) => ({ ...d, profile: parsed.data }));
              setError("");
              notice("Profile saved");
            }}
          >
            <ProfileFields profile={profile} onChange={setProfile} />
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button type="submit" className="button lime fit">
              Save profile
            </button>
          </form>
        </section>
        <div className="stack">
          <section className="card">
            <SectionTitle title="Your experience" />
            <div className="stack">
              <Field label="Appearance">
                <div className="segmented theme-options">
                  {(
                    [
                      ["light", Sun],
                      ["dark", Moon],
                      ["system", Monitor],
                    ] as const
                  ).map(([theme, Icon]) => (
                    <button
                      key={theme}
                      className={data.profile.theme === theme ? "active" : ""}
                      onClick={() => saveImmediate({ theme })}
                    >
                      <Icon size={16} />
                      {theme[0].toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Weight units">
                <div className="segmented">
                  <button
                    className={data.profile.units === "kg" ? "active" : ""}
                    onClick={() => saveImmediate({ units: "kg" })}
                  >
                    Kilograms (kg)
                  </button>
                  <button
                    className={data.profile.units === "lb" ? "active" : ""}
                    onClick={() => saveImmediate({ units: "lb" })}
                  >
                    Pounds (lb)
                  </button>
                </div>
              </Field>
              <Field label="Default rest time (seconds)">
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={profile.rest}
                  onChange={(e) =>
                    setProfile({ ...profile, rest: Number(e.target.value) })
                  }
                  onBlur={() => {
                    if (
                      Number.isInteger(profile.rest) &&
                      profile.rest >= 0 &&
                      profile.rest <= 600
                    ) {
                      saveImmediate({ rest: profile.rest });
                    } else {
                      setProfile((p) => ({ ...p, rest: data.profile.rest }));
                      notice("Rest time must be between 0 and 600 seconds.");
                    }
                  }}
                />
              </Field>
              <p className="help muted">
                New exercises use this rest time. Each routine and active
                workout can have its own.
              </p>
            </div>
          </section>
          <section className="card">
            <SectionTitle title="A fresh training plan" />
            <p className="help muted">
              Run through onboarding again to create another personalized
              routine. Your history stays with you.
            </p>
            <button
              className="button secondary full-width mt"
              onClick={onOnboard}
            >
              Restart onboarding
              <ArrowUpRight size={16} />
            </button>
          </section>
        </div>
      </div>
      <div className="spacer" />
      <section className="card">
        <SectionTitle title="Your data stays yours" />
        <p className="help muted">
          Everything is saved in this browser. Export a backup to move devices
          or keep a safe copy. Imports replace this device's current IronLog
          data after validation and confirmation.
        </p>
        <div className="data-actions">
          <button
            className="button secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ironlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              notice("Backup exported");
            }}
          >
            <Download size={17} />
            Export JSON
          </button>
          <button
            className="button secondary"
            onClick={() => input.current?.click()}
          >
            <Upload size={17} />
            Import JSON
          </button>
          <button
            className="button secondary danger-text"
            onClick={() => setConfirm("reset")}
          >
            <RotateCcw size={17} />
            Reset demo data
          </button>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 20 * 1024 * 1024) {
                notice("This file is too large. Backups must be under 20 MB.");
                return;
              }
              try {
                const parsed = dataSchema.safeParse(
                  JSON.parse(await file.text()),
                );
                if (!parsed.success) throw new Error();
                setImported(parsed.data);
                setConfirm("import");
              } catch {
                notice(
                  "This is not a valid IronLog v1 backup. Your data has not been changed.",
                );
              }
            }}
          />
        </div>
        <div className="storage-summary">
          {data.workouts.length} workouts · {data.routines.length} routines ·{" "}
          {data.exercises.filter((e) => e.custom).length} custom exercises ·{" "}
          {data.measurements.length} check-ins
          {data.active ? " · 1 active workout" : ""}
        </div>
      </section>
      <p className="app-version">
        IRONLOG / VERSION 1.0 <span>Built for the long game.</span>
      </p>
      {confirm && (
        <Confirm
          title={
            confirm === "reset"
              ? "Reset all data to the demo?"
              : "Replace your data with this backup?"
          }
          label={confirm === "reset" ? "Reset data" : "Import backup"}
          onClose={() => {
            setConfirm(null);
            setImported(null);
          }}
          onConfirm={() => {
            allowStorageRecovery();
            if (confirm === "reset") {
              const next = seed();
              next.profile.onboarded = true;
              next.profile.theme = data.profile.theme;
              setData(next);
              setProfile(next.profile);
              notice("Demo data restored");
            } else if (imported) {
              setData(imported);
              setProfile(imported.profile);
              notice("Backup imported successfully");
            }
          }}
        >
          {confirm === "reset"
            ? "This replaces all workouts, routines, measurements, preferences, and any active session. Export a backup first if you want to keep them."
            : `This validated backup contains ${imported?.workouts.length} workouts, ${imported?.routines.length} routines, and ${imported?.measurements.length} check-ins. It will replace all current data, including the active session.`}
        </Confirm>
      )}
    </>
  );
}
