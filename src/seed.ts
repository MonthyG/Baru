import type { Data, Exercise, Routine } from "./model";
import { addDays, dayKey, uid, weekStart } from "./domain";
const groups: [
  Exercise["muscle"],
  Exercise["secondary"],
  [string, Exercise["equipment"], string][],
][] = [
  [
    "Chest",
    ["Triceps", "Shoulders"],
    [
      [
        "Barbell Bench Press",
        "Barbell",
        "Plant your feet, tuck your shoulder blades, and lower to your mid-chest.",
      ],
      [
        "Incline Dumbbell Press",
        "Dumbbell",
        "Set a low incline and keep your forearms vertical.",
      ],
      [
        "Dumbbell Bench Press",
        "Dumbbell",
        "Lower with control and press the weights over your chest.",
      ],
      [
        "Incline Barbell Press",
        "Barbell",
        "Keep your ribs down and touch the bar to your upper chest.",
      ],
      [
        "Cable Fly",
        "Cable",
        "Keep a soft elbow bend and bring your hands together in an arc.",
      ],
      [
        "Pec Deck",
        "Machine",
        "Keep your shoulders down as you bring the pads together.",
      ],
      [
        "Push-Up",
        "Bodyweight",
        "Brace your trunk and lower your chest between your hands.",
      ],
      [
        "Chest Dip",
        "Bodyweight",
        "Lean slightly forward and keep your elbows controlled.",
      ],
      [
        "Machine Chest Press",
        "Machine",
        "Align the handles with your chest and keep your back against the pad.",
      ],
      [
        "Dumbbell Floor Press",
        "Dumbbell",
        "Pause with your upper arms on the floor before pressing.",
      ],
    ],
  ],
  [
    "Back",
    ["Biceps", "Forearms"],
    [
      [
        "Barbell Row",
        "Barbell",
        "Hinge at the hips and row the bar toward your lower ribs.",
      ],
      [
        "Lat Pulldown",
        "Cable",
        "Drive your elbows down without leaning far back.",
      ],
      [
        "Pull-Up",
        "Bodyweight",
        "Start from a controlled hang and pull your chest toward the bar.",
      ],
      [
        "Seated Cable Row",
        "Cable",
        "Sit tall and pull toward your waist without swinging.",
      ],
      [
        "One-Arm Dumbbell Row",
        "Dumbbell",
        "Keep your hips square and drive your elbow toward your hip.",
      ],
      [
        "Chest-Supported Row",
        "Dumbbell",
        "Keep your chest on the bench and squeeze your shoulder blades.",
      ],
      [
        "T-Bar Row",
        "Barbell",
        "Brace your torso and row without jerking your lower back.",
      ],
      [
        "Straight-Arm Pulldown",
        "Cable",
        "Keep your elbows nearly straight and pull toward your thighs.",
      ],
      [
        "Chin-Up",
        "Bodyweight",
        "Use an underhand grip and pull your elbows toward your sides.",
      ],
      [
        "Inverted Row",
        "Bodyweight",
        "Keep a straight body and pull your chest to the bar.",
      ],
      [
        "Machine Row",
        "Machine",
        "Keep your chest supported throughout the pull.",
      ],
      [
        "Band Row",
        "Resistance band",
        "Brace your trunk and draw your elbows close to your ribs.",
      ],
    ],
  ],
  [
    "Shoulders",
    ["Triceps"],
    [
      [
        "Overhead Press",
        "Barbell",
        "Squeeze your glutes and press overhead without arching your back.",
      ],
      [
        "Dumbbell Shoulder Press",
        "Dumbbell",
        "Keep wrists over elbows and finish with arms overhead.",
      ],
      [
        "Dumbbell Lateral Raise",
        "Dumbbell",
        "Lead with your elbows and raise to shoulder height.",
      ],
      [
        "Cable Lateral Raise",
        "Cable",
        "Keep your shoulder down and lift with a soft elbow.",
      ],
      [
        "Face Pull",
        "Cable",
        "Pull the rope toward your forehead with your elbows high.",
      ],
      [
        "Reverse Pec Deck",
        "Machine",
        "Keep your chest against the pad and open your arms wide.",
      ],
      [
        "Arnold Press",
        "Dumbbell",
        "Rotate smoothly as you press without flaring your ribs.",
      ],
      [
        "Rear Delt Fly",
        "Dumbbell",
        "Hinge forward and open your arms without shrugging.",
      ],
      [
        "Pike Push-Up",
        "Bodyweight",
        "Keep hips high and lower your head between your hands.",
      ],
      [
        "Band Pull-Apart",
        "Resistance band",
        "Keep arms long and pull the band toward your chest.",
      ],
    ],
  ],
  [
    "Quads",
    ["Glutes", "Core"],
    [
      [
        "Barbell Back Squat",
        "Barbell",
        "Brace before descending and drive through your whole foot.",
      ],
      [
        "Front Squat",
        "Barbell",
        "Keep elbows high and sit between your heels.",
      ],
      [
        "Leg Press",
        "Machine",
        "Lower under control while keeping your pelvis against the pad.",
      ],
      [
        "Goblet Squat",
        "Dumbbell",
        "Hold the weight at your chest and let your knees track over your toes.",
      ],
      [
        "Bulgarian Split Squat",
        "Dumbbell",
        "Keep your front foot planted and lower straight down.",
      ],
      [
        "Leg Extension",
        "Machine",
        "Align your knee with the pivot and extend without swinging.",
      ],
      [
        "Hack Squat",
        "Machine",
        "Keep your back against the pad and push through midfoot.",
      ],
      [
        "Walking Lunge",
        "Dumbbell",
        "Take steady steps and keep your front knee aligned with your foot.",
      ],
      [
        "Bodyweight Squat",
        "Bodyweight",
        "Sit between your hips and keep your heels grounded.",
      ],
      [
        "Step-Up",
        "Dumbbell",
        "Drive through the elevated foot without pushing off the back leg.",
      ],
      [
        "Reverse Lunge",
        "Bodyweight",
        "Step back softly and keep your front foot flat.",
      ],
    ],
  ],
  [
    "Hamstrings",
    ["Glutes", "Back"],
    [
      [
        "Romanian Deadlift",
        "Barbell",
        "Push your hips back while keeping the bar close to your legs.",
      ],
      [
        "Seated Leg Curl",
        "Machine",
        "Keep hips down and curl through a controlled range.",
      ],
      [
        "Lying Leg Curl",
        "Machine",
        "Press hips into the pad and avoid arching your back.",
      ],
      [
        "Dumbbell Romanian Deadlift",
        "Dumbbell",
        "Keep the weights close and stop when you feel a hamstring stretch.",
      ],
      [
        "Single-Leg Romanian Deadlift",
        "Dumbbell",
        "Keep your hips square as your back leg extends.",
      ],
      [
        "Good Morning",
        "Barbell",
        "Brace firmly and hinge with a soft bend in your knees.",
      ],
      [
        "Nordic Curl",
        "Bodyweight",
        "Maintain a straight hip line and lower as slowly as you can.",
      ],
      [
        "Band Leg Curl",
        "Resistance band",
        "Keep your thigh still while curling your heel toward your glute.",
      ],
    ],
  ],
  [
    "Glutes",
    ["Hamstrings", "Core"],
    [
      [
        "Barbell Hip Thrust",
        "Barbell",
        "Keep your chin tucked and finish by squeezing your glutes.",
      ],
      [
        "Deadlift",
        "Barbell",
        "Brace, take slack out of the bar, and push the floor away.",
      ],
      [
        "Glute Bridge",
        "Bodyweight",
        "Keep ribs down and lift your hips through your heels.",
      ],
      [
        "Cable Kickback",
        "Cable",
        "Keep your pelvis still and extend your hip without arching.",
      ],
      [
        "Kettlebell Swing",
        "Kettlebell",
        "Snap your hips forward and let the bell float.",
      ],
      [
        "Sumo Deadlift",
        "Barbell",
        "Push your knees out and keep the bar close.",
      ],
      [
        "Hip Abduction",
        "Machine",
        "Keep your torso still while opening your knees.",
      ],
      [
        "Band Lateral Walk",
        "Resistance band",
        "Keep tension on the band and take small controlled steps.",
      ],
    ],
  ],
  [
    "Biceps",
    ["Forearms"],
    [
      [
        "Dumbbell Curl",
        "Dumbbell",
        "Keep elbows still and turn palms up as you curl.",
      ],
      [
        "Barbell Curl",
        "Barbell",
        "Keep your upper arms by your sides and avoid swinging.",
      ],
      [
        "Hammer Curl",
        "Dumbbell",
        "Keep palms facing each other and wrists neutral.",
      ],
      [
        "Preacher Curl",
        "Machine",
        "Keep your upper arms against the pad through each rep.",
      ],
      [
        "Cable Curl",
        "Cable",
        "Keep elbows close and control the lowering phase.",
      ],
      [
        "Incline Dumbbell Curl",
        "Dumbbell",
        "Let your arms hang behind your torso without moving your shoulders.",
      ],
      [
        "Concentration Curl",
        "Dumbbell",
        "Brace your elbow against your thigh and curl slowly.",
      ],
    ],
  ],
  [
    "Triceps",
    [],
    [
      [
        "Triceps Pushdown",
        "Cable",
        "Pin your elbows to your sides and extend fully.",
      ],
      [
        "Overhead Cable Extension",
        "Cable",
        "Keep your elbows pointing forward as you straighten your arms.",
      ],
      [
        "Skull Crusher",
        "Barbell",
        "Bend only at the elbows and lower the bar behind your forehead.",
      ],
      [
        "Close-Grip Bench Press",
        "Barbell",
        "Keep wrists stacked and elbows close to your body.",
      ],
      [
        "Dumbbell Overhead Extension",
        "Dumbbell",
        "Keep your ribs down and lower behind your head.",
      ],
      [
        "Diamond Push-Up",
        "Bodyweight",
        "Keep elbows close and maintain a firm plank.",
      ],
      [
        "Triceps Kickback",
        "Dumbbell",
        "Hold your upper arm still and straighten your elbow.",
      ],
    ],
  ],
  [
    "Core",
    [],
    [
      [
        "Cable Crunch",
        "Cable",
        "Curl your ribs toward your pelvis instead of pulling with your arms.",
      ],
      [
        "Hanging Knee Raise",
        "Bodyweight",
        "Tilt your pelvis up and avoid swinging.",
      ],
      [
        "Reverse Crunch",
        "Bodyweight",
        "Roll your pelvis off the floor with control.",
      ],
      [
        "Dead Bug",
        "Bodyweight",
        "Keep your lower back gently pressed to the floor.",
      ],
      [
        "Bicycle Crunch",
        "Bodyweight",
        "Rotate from your trunk and keep the movement slow.",
      ],
      [
        "Ab Wheel Rollout",
        "Bodyweight",
        "Brace your abs and stop before your lower back arches.",
      ],
      [
        "Pallof Press",
        "Cable",
        "Resist rotation as you press your hands straight out.",
      ],
      [
        "Russian Twist",
        "Bodyweight",
        "Rotate your shoulders together with your trunk.",
      ],
    ],
  ],
  [
    "Calves",
    [],
    [
      [
        "Standing Calf Raise",
        "Machine",
        "Pause at the top and lower your heels through a full stretch.",
      ],
      [
        "Seated Calf Raise",
        "Machine",
        "Keep the balls of your feet planted and lift your heels.",
      ],
      [
        "Single-Leg Calf Raise",
        "Bodyweight",
        "Use support for balance and move through a full range.",
      ],
      [
        "Dumbbell Calf Raise",
        "Dumbbell",
        "Rise onto your toes without rolling your ankles.",
      ],
    ],
  ],
  [
    "Forearms",
    [],
    [
      [
        "Wrist Curl",
        "Dumbbell",
        "Support your forearms and curl only at your wrists.",
      ],
      [
        "Reverse Curl",
        "Barbell",
        "Use an overhand grip and keep wrists straight.",
      ],
      [
        "Reverse Wrist Curl",
        "Dumbbell",
        "Support your forearms and lift the backs of your hands.",
      ],
    ],
  ],
  [
    "Quads",
    ["Glutes", "Core"],
    [
      [
        "Kettlebell Goblet Squat",
        "Kettlebell",
        "Keep the bell close to your chest and sit between your heels.",
      ],
      [
        "Kettlebell Reverse Lunge",
        "Kettlebell",
        "Hold the bell close and step back into a controlled lunge.",
      ],
    ],
  ],
  [
    "Hamstrings",
    ["Glutes", "Back"],
    [
      [
        "Kettlebell Deadlift",
        "Kettlebell",
        "Hinge over the bell, brace your trunk, and stand tall through your hips.",
      ],
    ],
  ],
  [
    "Chest",
    ["Triceps", "Shoulders"],
    [
      [
        "Kettlebell Floor Press",
        "Kettlebell",
        "Keep your wrist stacked and pause with your upper arm on the floor.",
      ],
      [
        "Band Chest Press",
        "Resistance band",
        "Anchor the band securely behind you and press without flaring your ribs.",
      ],
    ],
  ],
  [
    "Shoulders",
    ["Triceps"],
    [
      [
        "Kettlebell Overhead Press",
        "Kettlebell",
        "Start from the rack position and press with your ribs down.",
      ],
      [
        "Band Overhead Press",
        "Resistance band",
        "Stand securely on the band and press overhead with a braced trunk.",
      ],
    ],
  ],
  [
    "Back",
    ["Biceps"],
    [
      [
        "Kettlebell Row",
        "Kettlebell",
        "Brace your free hand on support and row the bell toward your hip.",
      ],
    ],
  ],
];
export const catalog: Exercise[] = groups.flatMap(([muscle, secondary, rows]) =>
  rows.map(([name, equipment, cue]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    muscle,
    secondary,
    equipment,
    cue,
  })),
);
const makeRoutine = (
  id: string,
  name: string,
  description: string,
  names: string[],
  reps = [8, 12],
): Routine => ({
  id,
  name,
  description,
  items: names.map((n) => ({
    id: uid(),
    exerciseId: catalog.find((e) => e.name === n)!.id,
    sets: 3,
    minReps: reps[0],
    maxReps: reps[1],
    rest: 90,
    superset: "",
  })),
});
export function seed(): Data {
  const routines = [
    makeRoutine(
      "push",
      "Push day",
      "Chest, shoulders & triceps. Build a stronger upper body.",
      [
        "Barbell Bench Press",
        "Incline Dumbbell Press",
        "Dumbbell Shoulder Press",
        "Dumbbell Lateral Raise",
        "Triceps Pushdown",
      ],
    ),
    makeRoutine(
      "pull",
      "Pull day",
      "Back & biceps. Every rep, a stronger foundation.",
      [
        "Lat Pulldown",
        "Barbell Row",
        "Seated Cable Row",
        "Face Pull",
        "Dumbbell Curl",
      ],
    ),
    makeRoutine(
      "legs",
      "Leg day",
      "Quads, hamstrings & glutes. Strength from the ground up.",
      [
        "Barbell Back Squat",
        "Romanian Deadlift",
        "Leg Press",
        "Seated Leg Curl",
        "Standing Calf Raise",
      ],
    ),
    makeRoutine(
      "beginner",
      "Full body · Foundations",
      "A balanced three-day starting point. Leave two reps in reserve.",
      [
        "Goblet Squat",
        "Dumbbell Bench Press",
        "Seated Cable Row",
        "Dumbbell Romanian Deadlift",
        "Dead Bug",
      ],
    ),
  ];
  routines[0].items[0] = {
    ...routines[0].items[0],
    sets: 4,
    minReps: 6,
    maxReps: 8,
    rest: 120,
  };
  routines[0].items[3].superset = "A";
  routines[0].items[4].superset = "A";
  const workouts: Data["workouts"] = [];
  const monday = weekStart();
  const weights: Record<string, number> = {
    "barbell-bench-press": 60,
    "incline-dumbbell-press": 20,
    "dumbbell-shoulder-press": 17.5,
    "dumbbell-lateral-raise": 7.5,
    "triceps-pushdown": 22.5,
    "lat-pulldown": 45,
    "barbell-row": 45,
    "seated-cable-row": 40,
    "face-pull": 15,
    "dumbbell-curl": 10,
    "barbell-back-squat": 70,
    "romanian-deadlift": 60,
    "leg-press": 110,
    "seated-leg-curl": 30,
    "standing-calf-raise": 40,
  };
  for (let week = 11; week >= 0; week--)
    for (let d = 0; d < 3; d++) {
      const date = addDays(monday, -week * 7 + d * 2);
      date.setHours(17, 30, 0, 0);
      if (date.getTime() >= Date.now()) continue;
      const routine = routines[d];
      const gain = Math.floor((11 - week) / 3) * 2.5;
      workouts.push({
        id: uid(),
        routineId: routine.id,
        name: routine.name,
        startedAt: date.toISOString(),
        endedAt: new Date(
          date.getTime() + (43 + d * 4 + (week % 4)) * 60000,
        ).toISOString(),
        notes:
          week % 4 === 0
            ? "Good energy today. Kept the last reps controlled."
            : "",
        restUntil: null,
        restDuration: 0,
        items: routine.items.map((item) => ({
          id: uid(),
          exerciseId: item.exerciseId,
          rest: item.rest,
          superset: item.superset,
          sets: Array.from({ length: item.sets }, (_, s) => ({
            id: uid(),
            weight: (weights[item.exerciseId] || 20) + gain,
            reps: item.minReps + (s === 0 ? 2 : s === 1 ? 1 : 0),
            done: true,
            type: "normal" as const,
          })),
        })),
      });
    }
  const measurements = Array.from({ length: 14 }, (_, i) => ({
    id: uid(),
    date: dayKey(addDays(new Date(), -(13 - i) * 7)),
    weight: 79.2 - i * 0.12,
    waist: 84 - i * 0.1,
    chest: 101 + i * 0.1,
    hips: 98,
    arm: 34 + i * 0.04,
  }));
  return {
    version: 1,
    profile: {
      name: "Alex",
      units: "kg",
      experience: "Intermediate",
      days: 3,
      goal: "Strength",
      equipment: ["Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight"],
      theme: "light",
      rest: 90,
      onboarded: false,
    },
    exercises: catalog,
    favorites: ["barbell-bench-press", "barbell-back-squat", "deadlift"],
    routines,
    workouts,
    measurements,
    active: null,
  };
}
