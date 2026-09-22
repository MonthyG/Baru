import { useEffect, useState } from "react";
import type { Profile } from "../model";
import { displayWeight, toKg } from "../domain";
import { Field } from "./ui";
export function HeightField({
  height,
  units,
  onChange,
  required = false,
}: {
  height: number | null;
  units: Profile["units"];
  onChange: (v: number | null) => void;
  required?: boolean;
}) {
  const [raw, setRaw] = useState(
    height
      ? String(Math.round((height / (units === "lb" ? 2.54 : 1)) * 10) / 10)
      : "",
  );
  useEffect(
    () =>
      setRaw(
        height
          ? String(Math.round((height / (units === "lb" ? 2.54 : 1)) * 10) / 10)
          : "",
      ),
    [height, units],
  );
  return (
    <Field label={`Height (${units === "kg" ? "cm" : "inches"})`}>
      <input
        required={required}
        type="number"
        inputMode="decimal"
        step="0.1"
        min={units === "kg" ? 100 : 39.4}
        max={units === "kg" ? 250 : 98.4}
        value={raw}
        placeholder={units === "kg" ? "e.g. 175" : "e.g. 69"}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(
            e.target.value
              ? Number(e.target.value) * (units === "lb" ? 2.54 : 1)
              : null,
          );
        }}
      />
    </Field>
  );
}
export function BodyFields({
  profile,
  onChange,
  weight,
  onWeight,
  required = false,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
  weight?: number | null;
  onWeight?: (w: number | null) => void;
  required?: boolean;
}) {
  return (
    <div className="form-grid">
      <Field label="Age (years)">
        <input
          required={required}
          type="number"
          inputMode="numeric"
          min={13}
          max={120}
          value={profile.age ?? ""}
          placeholder="Your age"
          onChange={(e) =>
            onChange({
              ...profile,
              age: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </Field>
      <HeightField
        height={profile.height}
        units={profile.units}
        required={required}
        onChange={(height) => onChange({ ...profile, height })}
      />
      {onWeight && (
        <Field label={`Bodyweight (${profile.units})`}>
          <input
            required={required}
            type="number"
            inputMode="decimal"
            step="0.1"
            min={displayWeight(20, profile.units)}
            max={displayWeight(500, profile.units)}
            value={
              weight === null || weight === undefined
                ? ""
                : displayWeight(weight, profile.units)
            }
            placeholder="Your current weight"
            onChange={(e) =>
              onWeight(
                e.target.value
                  ? toKg(Number(e.target.value), profile.units)
                  : null,
              )
            }
          />
        </Field>
      )}
    </div>
  );
}
