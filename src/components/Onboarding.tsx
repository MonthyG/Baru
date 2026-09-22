import { useState } from "react";
import { ArrowRight, ArrowLeft, Dumbbell, Check } from "lucide-react";
import { useStore } from "../store";
import { equipment, profileSchema, goalsSchema, type Profile } from "../model";
import { dayKey, personalizedRoutine, uid } from "../domain";
import { Field, Modal } from "./ui";
import { BodyFields } from "./BodyFields";
import { BmiCard } from "./BmiCard";
import { GoalFields } from "../pages/Goals";
export function Onboarding({ onClose }: { onClose: () => void }) {
  const { data, setData, notice } = useStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    ...data.profile,
    name: data.profile.name === "You" ? "" : data.profile.name,
  });
  const [weight, setWeight] = useState<number | null>(
    [...data.measurements].sort((a, b) => b.date.localeCompare(a.date))[0]
      ?.weight ?? null,
  );
  const [goals, setGoals] = useState(data.goals);
  const [error, setError] = useState("");
  const plan = personalizedRoutine(
    { ...profile, name: profile.name || "Your" },
    data.exercises,
  );
  const valid =
    step === 0
      ? profile.name.trim().length > 0
      : step === 1
        ? profile.age !== null &&
          profile.height !== null &&
          weight !== null &&
          weight >= 20 &&
          weight <= 500 &&
          profileSchema.safeParse({ ...profile, name: profile.name || "You" })
            .success
        : step === 3
          ? profile.equipment.length > 0
          : step === 4
            ? goalsSchema.safeParse(goals).success &&
              (!goals.date || goals.weight !== null)
            : true;
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
              your beginning.
            </h2>
            <p>
              A clean log. Your own goals.
              <br />
              One day at a time.
            </p>
          </div>
          <span className="onboarding-foot">
            PRIVATE BY DEFAULT. ALWAYS YOURS.
          </span>
        </div>
        <div className="onboarding-content">
          <div className="onboard-progress">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={i <= step ? "filled" : ""} />
            ))}
          </div>
          <div className="eyebrow">STEP {step + 1} OF 5</div>
          <h2>
            {
              [
                "First, a little about you.",
                "Your starting point.",
                "What are you training for?",
                "Your training setup.",
                "Set your direction.",
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
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Preferred units">
                <div className="segmented">
                  <button
                    className={profile.units === "kg" ? "active" : ""}
                    onClick={() => setProfile({ ...profile, units: "kg" })}
                  >
                    Kilograms / cm
                  </button>
                  <button
                    className={profile.units === "lb" ? "active" : ""}
                    onClick={() => setProfile({ ...profile, units: "lb" })}
                  >
                    Pounds / inches
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
              <p className="help muted">
                Just age, height, and bodyweight. Your weight becomes your first
                check-in, dated today.
              </p>
              <BodyFields
                profile={profile}
                onChange={setProfile}
                weight={weight}
                onWeight={setWeight}
                required
              />
              <BmiCard
                weight={weight}
                height={profile.height}
                age={profile.age}
              />
            </div>
          )}
          {step === 2 && (
            <div className="stack">
              <Field label="Primary training goal">
                <select
                  value={profile.goal}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      goal: e.target.value as Profile["goal"],
                    })
                  }
                >
                  <option>Strength</option>
                  <option>Muscle</option>
                  <option>General fitness</option>
                </select>
              </Field>
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
              <p className="help muted">
                We’ll use your experience, goal, schedule, and equipment to
                build your first routine.
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="equipment-choices">
              {equipment.map((e) => (
                <button
                  key={e}
                  aria-pressed={profile.equipment.includes(e)}
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
                  {e}
                  {profile.equipment.includes(e) && <Check size={17} />}
                </button>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="stack">
              <p className="help muted">
                Optional targets for your food log and bodyweight. You can set
                or change these later in Goals & reminders.
              </p>
              <GoalFields
                goals={goals}
                onChange={setGoals}
                units={profile.units}
              />
              <div className="starting-plan">
                <h3>{plan.name}</h3>
                <p>
                  {profile.days} days / week · {plan.items.length} exercises
                </p>
                {plan.items.map((i) => (
                  <div key={i.id}>
                    <span>
                      {data.exercises.find((e) => e.id === i.exerciseId)?.name}
                    </span>
                    <small>
                      {i.sets} × {i.minReps}–{i.maxReps}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <p className="error">{error}</p>}
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
                if (step < 4) {
                  setStep(step + 1);
                  return;
                }
                const parsed = profileSchema.safeParse({
                  ...profile,
                  onboarded: true,
                });
                const parsedGoals = goalsSchema.safeParse(goals);
                if (
                  !parsed.success ||
                  !parsedGoals.success ||
                  !plan.items.length
                ) {
                  setError(
                    "Check your profile, goals, and available equipment.",
                  );
                  return;
                }
                setData((d) => ({
                  ...d,
                  profile: parsed.data,
                  goals: parsedGoals.data,
                  routines: [plan, ...d.routines],
                  measurements:
                    weight !== null
                      ? [
                          ...d.measurements.filter((m) => m.date !== dayKey()),
                          {
                            id:
                              d.measurements.find((m) => m.date === dayKey())
                                ?.id || uid(),
                            date: dayKey(),
                            weight,
                            height: profile.height,
                            waist: 0,
                            chest: 0,
                            hips: 0,
                            arm: 0,
                          },
                        ]
                      : d.measurements,
                }));
                notice("Your starting point and routine are ready");
                onClose();
              }}
            >
              {step === 4 ? "Start my journey" : "Continue"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
