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

IronLog opens a four-step onboarding flow. Enter your preferences to generate a routine, or choose **Skip for now** to explore as Alex. The seed includes 96 real exercises, a push/pull/legs split, a beginner full-body plan, approximately twelve weeks of realistic workout history, and fourteen measurement entries. Seed dates are relative to the first launch date. During first-run onboarding you can uncheck **Keep demo history** to start with an empty workout and measurement log.

Data is stored under `ironlog.v1` in localStorage. Your browser, device, and origin each have their own store. The active session and rest timer survive reloads. Export a JSON backup in Settings before clearing browser storage or changing devices. Multiple open tabs synchronize saved changes; avoid editing the same session simultaneously because the latest write wins. Storage failures show a visible warning. Corrupt stored data is preserved until an explicit reset or validated import.

## Architecture

- `src/model.ts`: TypeScript types and Zod schemas. Imports validate version, ranges, dates, IDs, completed sets, and exercise references before replacement.
- `src/seed.ts`: Exercise catalog, starter routines, and deterministic relative-date sample training history.
- `src/domain.ts`: Pure calculations for volume, Epley 1RM, personal records, streaks, unit conversions, previous-set lookup, scheduling, and personalized routines.
- `src/store.tsx`: Shared React state, localStorage persistence, theme preferences, cross-tab updates, and feedback.
- `src/components/`: Reusable native-dialog modals, confirmation prompts, form fields, chart wrappers, empty states, and onboarding.
- `src/pages/`: Dashboard, library, routines, live workout, history, analytics, measurements, and settings.
- `src/styles.css`: Shared design tokens, graphite/lime visual identity, dark theme, responsive layouts, touch targets, and reduced-motion support. Tailwind is configured through its Vite plugin and CSS import.
- Hash navigation supports browser back/forward and refreshes on every section without server routing configuration.
- Recharts draws charts from the same logged records displayed in history. Lucide supplies icons. Fonts and the custom SVG favicon are local/system assets.
- A feature-detected optional WebMCP navigation tool uses the same section navigation as the interface; unsupported browsers ignore it.

## Implemented features

- [x] Skippable, repeatable onboarding: name, kg/lb, experience, weekly frequency, goal, and equipment; personalized starter routine.
- [x] Dashboard: greeting/date, scheduled next routine, one-tap start/resume, weekly training streak, volume comparison, recent records, training strip, and recent sessions.
- [x] 96 exercises with primary/secondary muscles, equipment, and form cues; search, muscle/equipment filters, favourites, custom exercise CRUD.
- [x] Exercise details: full training history, best set, estimated 1RM, and progression chart.
- [x] Routine create/edit/duplicate/delete; reorder both routines and exercises; target sets/rep ranges/rest; letter-labelled supersets; duration and muscle coverage.
- [x] Live workouts: elapsed timer, editable weight/reps, same-index prior sets, completed checkboxes, warm-up/failure/drop sets, add/remove sets and exercises, notes, volume/set totals.
- [x] Automatic per-exercise rest countdown with +30 seconds and skip, persistent across refreshes, visible in the mobile bottom dock.
- [x] Finish/discard confirmations and workout summaries with duration, volume, sets, and newly broken personal records.
- [x] History list/calendar, month navigation, per-day sessions, monthly workout count, streak, full set breakdown, edit/delete.
- [x] Analytics: weekly volume, workouts/week, primary-muscle volume split, per-exercise weight and estimated 1RM charts, all-time weight/1RM/set-volume records.
- [x] Dated bodyweight and waist/chest/hips/arm entries with edit/delete, chart, and 30/90-day comparisons.
- [x] Settings: light/dark/system theme, instant kg/lb conversion, cm/in measurement conversion, default rest, profile, restart onboarding, reset demo, export/import JSON.
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

`npm run build` checks TypeScript and produces the production bundle. `npm test` covers volume, record recalculation, unit conversions, previous-set references, workout initialization, streaks, personalized plans for every equipment type, and valid/invalid backup handling. Browser QA covers desktop and phone layouts, live logging and timer restoration, onboarding, navigation, editing, and settings.
