# IronLog

A complete, responsive strength-training journal built with React, TypeScript, Vite, and Tailwind CSS. All app data stays in your browser. No accounts, paid APIs, server database, environment variables, or runtime network services are required.

## Run locally

Requires Node.js 22.12+ (Node 22 LTS recommended) and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To produce a static production build:

```sh
npm run build
npm run preview
```

Run the domain and backup-validation tests with `npm test`.

## First run

IronLog starts with an empty customer log: no sample profile, workouts, routines, weigh-ins, meals, favourites, or reminders. The 96-exercise library remains as reference material. Five-step onboarding collects name, units, experience, age, height, bodyweight, training goal/frequency, equipment, and optional calorie/protein/bodyweight targets. Completing onboarding saves today's first weigh-in and generates a personal routine. Skipping leaves the log empty; onboarding can be repeated from Settings. No waist or other circumference measurements are requested.

Data is stored under `ironlog.customer.v2` in localStorage. Your browser, device, and origin each have their own store. The active session and rest timer survive reloads. Export a JSON backup in Settings before clearing browser storage or changing devices. Multiple open tabs synchronize saved changes; avoid editing the same session simultaneously because the latest write wins. Storage failures show a visible warning. Corrupt stored data is preserved until an explicit reset or validated import.

Earlier demo storage (`ironlog.v1`) is intentionally not loaded or copied into the customer log. It is left untouched as a legacy backup. Reset all data in Settings creates an empty log and restarts onboarding; it never restores sample activity.

## Architecture

- `src/model.ts`: TypeScript types and Zod schemas. Imports validate version, ranges, dates, IDs, completed sets, and exercise references before replacement.
- `src/seed.ts`: Exercise catalog and legacy demo fixtures used only by tests. The app uses `src/fresh.ts` to initialize an empty customer log.
- `src/wellness.ts`: BMI, daily food totals, target status, and local reminder scheduling.
- `src/domain.ts`: Pure calculations for volume, Epley 1RM, personal records, streaks, unit conversions, previous-set lookup, scheduling, and personalized routines.
- `src/store.tsx`: Shared React state, localStorage persistence, theme preferences, cross-tab updates, and feedback.
- `src/components/`: Reusable native-dialog modals, confirmation prompts, form fields, chart wrappers, empty states, and onboarding.
- `src/pages/`: Dashboard, library, routines, live workout, history, analytics, bodyweight/BMI, nutrition, goals/reminders, and settings.
- `src/styles.css`: Shared design tokens, graphite/lime visual identity, dark theme, responsive layouts, touch targets, and reduced-motion support. Tailwind is configured through its Vite plugin and CSS import.
- Hash navigation supports browser back/forward and refreshes on every section without server routing configuration.
- Recharts draws charts from the same logged records displayed in history. Lucide supplies icons. Fonts and the custom SVG favicon are local/system assets.
- A feature-detected optional WebMCP navigation tool uses the same section navigation as the interface; unsupported browsers ignore it.

## Implemented features

- [x] Skippable, repeatable onboarding: name, kg/lb, age, height, bodyweight, experience, weekly frequency, goal, equipment, and optional nutrition targets; personalized starter routine.
- [x] Dashboard: greeting/date, scheduled next routine, one-tap start/resume, weekly training streak, volume comparison, recent records, training strip, and recent sessions.
- [x] 96 exercises with primary/secondary muscles, equipment, and form cues; search, muscle/equipment filters, favourites, custom exercise CRUD.
- [x] Exercise details: full training history, best set, estimated 1RM, and progression chart.
- [x] Routine create/edit/duplicate/delete; reorder both routines and exercises; target sets/rep ranges/rest; letter-labelled supersets; duration and muscle coverage.
- [x] Live workouts: elapsed timer, editable weight/reps, same-index prior sets, completed checkboxes, warm-up/failure/drop sets, add/remove sets and exercises, notes, volume/set totals.
- [x] Automatic per-exercise rest countdown with +30 seconds and skip, persistent across refreshes, visible in the mobile bottom dock.
- [x] Finish/discard confirmations and workout summaries with duration, volume, sets, and newly broken personal records.
- [x] History list/calendar, month navigation, per-day sessions, monthly workout count, streak, full set breakdown, edit/delete.
- [x] Analytics: weekly volume, workouts/week, primary-muscle volume split, per-exercise weight and estimated 1RM charts, all-time weight/1RM/set-volume records.
- [x] Dated bodyweight-only check-ins with edit/delete, weight and BMI charts, age-aware BMI interpretation, and 30/90-day comparisons.
- [x] Food/meal CRUD by date and meal type, servings, calories, protein, daily remaining/fulfilled targets, and 7-day charts.
- [x] Editable daily calorie/protein targets, target bodyweight/date, weekly workout goal, and progress summaries.
- [x] Recurring workout, food, and weigh-in reminders with weekday/time selection, edit/pause/delete, persistent daily dismissal, and optional browser notifications.
- [x] Settings: light/dark/system theme, instant kg/lb conversion, cm/in height conversion, default rest, profile, restart onboarding, reset to empty, export/import JSON.
- [x] Responsive desktop/tablet/phone navigation; sticky one-handed workout controls; labelled forms, keyboard focus, native dialog focus management, validation, and empty states.

## Calculation and behavior notes

- Weights are stored in kilograms and dimensions in centimetres. Display conversion never rewrites historical canonical values. For paired dumbbells, enter the total external load consistently (e.g. two 20 kg dumbbells = 40 kg). Bodyweight exercise load is added external weight; unweighted reps can be logged at 0.
- Volume is the sum of `weight × reps` for completed sets, including warm-ups. Incomplete sets remain in history as skipped but contribute nothing to analytics.
- Records exclude warm-ups and incomplete sets. Estimated 1RM uses `weight × (1 + reps / 30)` (a single rep uses its actual weight). High-repetition estimates are less reliable. Best set is the completed non-warm-up set with the highest estimate.
- A training streak counts consecutive weeks containing at least one session, including an unfinished current week as a grace period. Weeks start on Monday in local time.
- Training days are evenly distributed across the week. Routines rotate by the number of sessions logged in the current week, following their visible order. Superset letters indicate exercises to alternate; rest remains adjustable per exercise and starts after every completed set.
- Duration estimates allow 40 seconds per set plus configured rest. Live and rest timers use absolute timestamps, so browser throttling does not lose elapsed time.
- 30/90-day measurement change compares the latest entry with the latest check-in on or before the relevant date; insufficient history shows an empty value.
- Custom exercises referenced by routines or logged/active workouts are protected from deletion to preserve history. Remove those references first if permanent deletion is needed.
- Imports are size-limited to 20 MB, schema-validated, and show a summary before confirmation. Import and reset replace all existing app data. Export first to keep a copy.

## Verification

`npm run build` checks TypeScript and produces the production bundle. `npm test` covers volume, record recalculation, unit conversions, previous-set references, workout initialization, streaks, personalized plans for every equipment type, valid/invalid backup handling, empty initialization, BMI boundaries, meal totals, targets, and reminder recurrence. Browser QA covers desktop and phone layouts, live logging and timer restoration, onboarding, nutrition edits and persistence, reminder delivery/dismissal, navigation, and settings.

## BMI, nutrition, and reminders

BMI is weight in kilograms divided by height in metres squared. Adult category boundaries (18.5, 25, 30) follow [CDC guidance](https://www.cdc.gov/bmi/adult-calculator/index.html) and are shown only for ages 20+. Ages 13–19 receive a note that interpretation requires age-specific percentiles; no adult category is assigned. BMI does not distinguish muscle from fat and is not a diagnosis. Each new weigh-in snapshots the current profile height, so later height edits do not rewrite historical chart points. No sex, waist, or circumference data is needed.

Food values are entered manually from labels or the user's own estimates. Daily totals multiply per-serving calories/protein by servings. Nutrition targets are optional and user-defined, not generated clinical recommendations. Data, goals, and reminder schedules are included in JSON backups. Older valid v1 exports are accepted with empty defaults for the new fields when deliberately imported.

Reminders run locally in the device's timezone. The app checks schedules every 30 seconds and on window focus. A due reminder stays available for that day until dismissed. Optional browser notifications require a user permission click and the app to remain open; they cannot reliably arrive when the app or browser is closed. In-app reminders work without notification permission.
