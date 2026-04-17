// src/constants/steps.js

/* ---------------- CONFIG ---------------- */
export const TOTAL_DAYS = 16;
export const STEPS_PER_SESSION = 16;

/* ---------------- IMAGE MAP ---------------- */

const IMAGE_MAP = {
  yoga1: "yoga-01.jpg",
  yoga2: "yoga-02.jpg",
  yoga3: "yoga-03.jpg",
  yoga4: "yoga-04.jpg",
  yoga5: "yoga-05.jpg",
  yoga6: "yoga-06.jpg",
  yoga7: "yoga-07.jpg",
  yoga8: "yoga-08.jpg",

  yoga71: "yoga-07-1.jpg",
  yoga72: "yoga-07-2.jpg",
  yoga73: "yoga-07-3.jpg",

  med1: "med-01.jpg",
  med2: "med-02.jpg",
  med3: "med-03.jpg",
  med4: "med-04.jpg",
  med5: "med-05.jpg",
  med6: "med-06.jpg",
  med7: "med-07.jpg",
  med8: "med-08.jpg"
};

/* ---------------- IMAGE PATH ---------------- */
// ✅ FIXED: No extra folder (no /yoga or /meditation)

export const getImagePath = (key) => {
  const file = IMAGE_MAP[key];
  return file ? `/assets/steps/${file}` : "";
};

/* ---------------- PHASE SYSTEM ---------------- */

export const getPhase = (day) => {
  if (day <= 4) return "Foundation";
  if (day <= 8) return "Control";
  if (day <= 12) return "Power";
  return "Transformation";
};

/* ---------------- STEP BUILDERS ---------------- */

const createYogaStep = (step, name, img, text, duration) => ({
  step,
  name,
  type: "yoga",
  img,
  text,
  duration
});

const createMedStep = (step, name, img, text, duration) => ({
  step,
  name,
  type: "meditation",
  img,
  text,
  duration
});

/* ---------------- DAY SESSIONS ---------------- */

export const DAY_SESSIONS = {
  1: [
    createYogaStep(1, "Mountain Pose", "yoga1", "Align posture, feel grounded", 30),
    createYogaStep(2, "Forward Fold", "yoga2", "Release tension", 30),
    createYogaStep(3, "Half Lift", "yoga3", "Activate spine", 30),
    createYogaStep(4, "Plank", "yoga4", "Engage core", 30),
    createYogaStep(5, "Cobra", "yoga5", "Open chest", 30),
    createYogaStep(6, "Downward Dog", "yoga6", "Stretch body", 30),
    createYogaStep(7, "Tree Pose", "yoga8", "Balance focus", 30),
    createYogaStep(8, "Warrior I", "yoga71", "Build stability", 30),

    createMedStep(9, "Calm Breathing", "med1", "Slow deep breathing", 45),
    createMedStep(10, "Focus Breath", "med2", "Stay present", 45),
    createMedStep(11, "Body Scan", "med3", "Release tension", 45),
    createMedStep(12, "Relax Mind", "med4", "Let thoughts pass", 45),
    createMedStep(13, "Awareness", "med5", "Observe thoughts", 45),
    createMedStep(14, "Stillness", "med6", "Feel calm", 45),
    createMedStep(15, "Visualization", "med7", "See better self", 45),
    createMedStep(16, "Deep Calm", "med8", "Absorb calm", 45)
  ],

  2: [
    createYogaStep(1, "Cat-Cow", "yoga7", "Mobilize spine", 35),
    createYogaStep(2, "Seated Fold", "yoga2", "Stretch back", 35),
    createYogaStep(3, "Low Lunge", "yoga71", "Open hips", 35),
    createYogaStep(4, "Side Stretch", "yoga72", "Lengthen body", 35),
    createYogaStep(5, "Bridge", "yoga73", "Strengthen back", 35),
    createYogaStep(6, "Twist", "yoga8", "Release spine", 35),
    createYogaStep(7, "Balance Pose", "yoga3", "Focus control", 35),
    createYogaStep(8, "Child Pose", "yoga4", "Relax deeply", 30),

    createMedStep(9, "Breathing", "med1", "Slow breath", 50),
    createMedStep(10, "Body Scan", "med2", "Relax body", 50),
    createMedStep(11, "Gratitude", "med5", "Positive focus", 50),
    createMedStep(12, "Visualization", "med6", "Calm place", 50),
    createMedStep(13, "Awareness", "med7", "Stay present", 50),
    createMedStep(14, "Counting Breath", "med3", "Focus mind", 50),
    createMedStep(15, "Release Thoughts", "med4", "Let go", 50),
    createMedStep(16, "Stillness", "med8", "Deep calm", 50)
  ]
};

/* ---------------- MAIN FUNCTION ---------------- */

export const getSessionSteps = (day = 1) => {
  const validDay = Math.min(Math.max(day, 1), TOTAL_DAYS);

  const steps = DAY_SESSIONS[validDay];
  if (!steps) return [];

  return steps.map((step) => ({
    ...step,
    id: `day-${validDay}-step-${step.step}`,
    image: getImagePath(step.img) // ✅ FIXED
  }));
};
