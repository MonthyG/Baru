import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Dumbbell,
  Target,
  CalendarDays,
  Layers,
} from "lucide-react";
import { useStore } from "../store";
import { equipment, type Profile } from "../model";
import { personalizedRoutine } from "../domain";
import { Field, Modal } from "./ui";
export function Onboarding({ onClose }: { onClose: () => void }) {
  const { data, setData, notice } = useStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    ...data.profile,
    name: data.profile.onboarded ? data.profile.name : "",
  });
  const [keepDemo, setKeepDemo] = useState(true);
  const valid =
    step === 0
      ? profile.name.trim().length > 0
      : step === 2
        ? profile.equipment.length > 0
        : true;
  const plan = personalizedRoutine(
    { ...profile, name: profile.name || "Your" },
    data.exercises,
  );
  const skip = () => {
    setData((d) => ({ ...d, profile: { ...d.profile, onboarded: true } }));
    onClose();
  };
  return (
    <Modal title="Welcome to IronLog." onClose={skip} wide>
      <div className="onboarding-layout">
        <div className="onboarding-art">
          <div className="brand">
            <span>
              <Dumbbell size={23} />
            </span>
            ironlog.
          </div>
          <div>
            <div className="eyebrow">YOUR STRENGTH, RECORDED.</div>
            <h2>
              Built for
              <br />
              the long game.
            </h2>
            <p>
              One session at a time.
              <br />
              Let's find your starting point.
            </p>
          </div>
          <span className="onboarding-foot">
            PRIVATE BY DEFAULT. ALWAYS YOURS.
          </span>
        </div>
        <div className="onboarding-content">
          <div className="onboard-progress">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i <= step ? "filled" : ""} />
            ))}
          </div>
          <div className="eyebrow">STEP {step + 1} OF 4</div>
          <h2>
            {
              [
                "First, a little about you.",
                "What are you training for?",
                "What do you have to work with?",
                "Your starting line.",
              ][step]
            }
          </h2>
          {step === 0 && (
            <div className="stack">
              <Field label="What should we call you?">
                <input
                  autoFocus
                  required
                  maxLength={100}
                  placeholder="Your first name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Preferred weight units">
                <div className="segmented">
                  <button
                    className={profile.units === "kg" ? "active" : ""}
                    onClick={() => setProfile({ ...profile, units: "kg" })}
                  >
                    Kilograms
                  </button>
                  <button
                    className={profile.units === "lb" ? "active" : ""}
                    onClick={() => setProfile({ ...profile, units: "lb" })}
                  >
                    Pounds
                  </button>
                </div>
              </Field>
              <Field label="Training experience">
                <select
                  value={profile.experience}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      experience: e.target.value as Profile["experience"],
                    })
                  }
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </Field>
            </div>
          )}
          {step === 1 && (
            <div className="stack">
              <div className="goal-choices">
                {(["Strength", "Muscle", "General fitness"] as const).map(
                  (g, i) => (
                    <button
                      key={g}
                      className={profile.goal === g ? "chosen" : ""}
                      onClick={() => setProfile({ ...profile, goal: g })}
                    >
                      <Target size={19} />
                      <span>
                        <strong>{g}</strong>
                        <small>
                          {
                            [
                              "Move heavier weights with confidence.",
                              "Build muscle with consistent volume.",
                              "Feel stronger in everyday life.",
                            ][i]
                          }
                        </small>
                      </span>
                      {profile.goal === g && <Check size={17} />}
                    </button>
                  ),
                )}
              </div>
              <Field label="Training days per week">
                <select
                  value={profile.days}
                  onChange={(e) =>
                    setProfile({ ...profile, days: Number(e.target.value) })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "day" : "days"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          {step === 2 && (
            <>
              <p className="help muted">
                Select everything you can use. We'll match your routine to your
                equipment.
              </p>
              <div className="equipment-choices">
                {equipment.map((e) => (
                  <button
                    key={e}
                    className={profile.equipment.includes(e) ? "chosen" : ""}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        equipment: profile.equipment.includes(e)
                          ? profile.equipment.filter((x) => x !== e)
                          : [...profile.equipment, e],
                      })
                    }
                  >
                    <span>{e}</span>
                    {profile.equipment.includes(e) && <Check size={17} />}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="starting-plan">
                <h3>{plan.name}</h3>
                <p>
                  <CalendarDays size={15} />
                  {profile.days} days / week <Layers size={15} />
                  {plan.items.length} exercises
                </p>
                {plan.items.map((i) => (
                  <div key={i.exerciseId}>
                    <span>
                      {data.exercises.find((e) => e.id === i.exerciseId)?.name}
                    </span>
                    <small>
                      {i.sets} × {i.minReps}–{i.maxReps}
                    </small>
                  </div>
                ))}
              </div>
              {!data.profile.onboarded && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={keepDemo}
                    onChange={(e) => setKeepDemo(e.target.checked)}
                  />
                  Keep demo history to explore the app
                </label>
              )}
              <p className="help muted">
                You can adapt this routine anytime. Rest days are built into
                your weekly schedule.
              </p>
            </>
          )}
          <div className="onboarding-actions">
            {step > 0 ? (
              <button
                aria-label="Previous step"
                className="icon-button"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={19} />
              </button>
            ) : (
              <button className="text-button" onClick={skip}>
                Skip for now
              </button>
            )}
            <button
              className="button lime"
              disabled={!valid}
              onClick={() => {
                if (step < 3) {
                  setStep(step + 1);
                  return;
                }
                setData((d) => ({
                  ...d,
                  profile: {
                    ...profile,
                    name: profile.name.trim(),
                    onboarded: true,
                  },
                  routines: [plan, ...d.routines],
                  ...(!d.profile.onboarded && !keepDemo
                    ? { workouts: [], measurements: [] }
                    : {}),
                }));
                notice("Your personalized routine is ready");
                onClose();
              }}
            >
              {step === 3 ? "Let’s get stronger" : "Continue"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
