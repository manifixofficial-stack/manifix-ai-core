// src/constants/steps.js

export const TOTAL_DAYS = 7;
export const TOTAL_STEPS_PER_DAY = 14;

/* ---------------- IMAGE PATH ---------------- */

const getYogaImage = (num) =>
  `/assets/steps/yoga/yoga-${String(num).padStart(2, "0")}.jpg`;

const getMedImage = (num) =>
  `/assets/steps/med/med-${String(num).padStart(2, "0")}.jpg`;

/* ---------------- STEP BUILDERS ---------------- */

const createYogaStep = (step, name, imageNum, guidance, duration = 30) => ({
  step,
  name,
  image: getYogaImage(imageNum),
  guidance,
  duration,
  type: "yoga"
});

const createMedStep = (step, name, imageNum, guidance, duration = 60) => ({
  step,
  name,
  image: getMedImage(imageNum),
  guidance,
  duration,
  type: "meditation"
});

/* ---------------- DAY SESSIONS ---------------- */

export const DAY_SESSIONS = {

  /* -------- DAY 1 -------- */
  1: [
    // Yoga (1–7)
    createYogaStep(1, "Mountain Pose", 1, "Stand tall, breathe deeply"),
    createYogaStep(2, "Forward Fold", 2, "Relax neck, release tension"),
    createYogaStep(3, "Half Lift", 3, "Keep spine straight"),
    createYogaStep(4, "Plank", 4, "Engage core"),
    createYogaStep(5, "Cobra", 5, "Open chest"),
    createYogaStep(6, "Downward Dog", 6, "Stretch body"),
    createYogaStep(7, "Child Pose", 7, "Relax deeply"),

    // Meditation (8–14)
    createMedStep(8, "Deep Breathing", 1, "Inhale slowly… exhale gently"),
    createMedStep(9, "Focus Breath", 2, "Stay present"),
    createMedStep(10, "Body Scan", 3, "Release tension"),
    createMedStep(11, "Relax Mind", 4, "Let thoughts go"),
    createMedStep(12, "Awareness", 5, "Observe mind"),
    createMedStep(13, "Stillness", 6, "Feel silence"),
    createMedStep(14, "Calm Presence", 7, "Stay peaceful")
  ],

  /* -------- DAY 2 -------- */
  2: [
    createYogaStep(1, "Cat-Cow", 8, "Move with breath"),
    createYogaStep(2, "Low Lunge", 9, "Open hips"),
    createYogaStep(3, "Warrior I", 10, "Strong stance"),
    createYogaStep(4, "Warrior II", 11, "Focus forward"),
    createYogaStep(5, "Triangle Pose", 12, "Stretch sideways"),
    createYogaStep(6, "Tree Pose", 13, "Balance"),
    createYogaStep(7, "Seated Forward Fold", 14, "Relax spine"),

    createMedStep(8, "Breath Counting", 8, "Count breaths"),
    createMedStep(9, "Focus Point", 9, "Stay steady"),
    createMedStep(10, "Thought Release", 10, "Let go"),
    createMedStep(11, "Inner Silence", 11, "Feel silence"),
    createMedStep(12, "Emotional Calm", 12, "Release emotions"),
    createMedStep(13, "Gentle Awareness", 13, "Relax focus"),
    createMedStep(14, "Deep Stillness", 14, "Go deeper")
  ],

  /* -------- DAY 3 -------- */
  3: [
    createYogaStep(1, "Sun Flow", 15, "Flow smoothly"),
    createYogaStep(2, "Plank Hold", 16, "Hold strong"),
    createYogaStep(3, "Side Plank", 17, "Balance"),
    createYogaStep(4, "Cobra Lift", 18, "Lift chest"),
    createYogaStep(5, "Bridge", 19, "Lift hips"),
    createYogaStep(6, "Supine Twist", 20, "Relax spine"),
    createYogaStep(7, "Relax Pose", 21, "Release body"),

    createMedStep(8, "Full Body Relax", 15, "Relax fully"),
    createMedStep(9, "Slow Breathing", 16, "Deep breaths"),
    createMedStep(10, "Tension Release", 17, "Release stress"),
    createMedStep(11, "Mind Relaxation", 18, "Soften mind"),
    createMedStep(12, "Calm Energy", 19, "Feel calm"),
    createMedStep(13, "Inner Peace", 20, "Peace inside"),
    createMedStep(14, "Deep Calm", 21, "Deep relaxation")
  ],

  /* -------- DAY 4 -------- */
  4: [
    createYogaStep(1, "Standing Stretch", 22, "Stretch up"),
    createYogaStep(2, "Chair Pose", 23, "Hold steady"),
    createYogaStep(3, "Eagle Arms", 24, "Stretch shoulders"),
    createYogaStep(4, "Warrior III", 25, "Balance"),
    createYogaStep(5, "Half Moon", 26, "Open body"),
    createYogaStep(6, "Pyramid Pose", 27, "Stretch legs"),
    createYogaStep(7, "Child Pose", 28, "Relax"),

    createMedStep(8, "Present Moment", 22, "Be present"),
    createMedStep(9, "Breath Awareness", 23, "Observe breath"),
    createMedStep(10, "Thought Watching", 24, "Watch thoughts"),
    createMedStep(11, "Silent Mind", 25, "Silence mind"),
    createMedStep(12, "Inner Focus", 26, "Focus inward"),
    createMedStep(13, "Still Awareness", 27, "Stay still"),
    createMedStep(14, "Deep Presence", 28, "Deep awareness")
  ],

  /* -------- DAY 5 -------- */
  5: [
    createYogaStep(1, "Warm Up Flow", 29, "Start gently"),
    createYogaStep(2, "Forward Fold", 30, "Release"),
    createYogaStep(3, "Plank", 31, "Core strong"),
    createYogaStep(4, "Upward Dog", 32, "Open chest"),
    createYogaStep(5, "Downward Dog", 33, "Stretch"),
    createYogaStep(6, "Tree Pose", 34, "Balance"),
    createYogaStep(7, "Seated Twist", 35, "Twist"),

    createMedStep(8, "Positive Breathing", 29, "Inhale positive"),
    createMedStep(9, "Gratitude", 30, "Feel grateful"),
    createMedStep(10, "Self Love", 31, "Accept yourself"),
    createMedStep(11, "Confidence Mind", 32, "Feel strong"),
    createMedStep(12, "Energy Boost", 33, "Energy rising"),
    createMedStep(13, "Inner Strength", 34, "You are strong"),
    createMedStep(14, "Positive State", 35, "Stay positive")
  ],

  /* -------- DAY 6 -------- */
  6: [
    createYogaStep(1, "Sun Flow", 36, "Flow"),
    createYogaStep(2, "Low Lunge", 37, "Open hips"),
    createYogaStep(3, "Warrior Flow", 38, "Move"),
    createYogaStep(4, "Triangle", 39, "Stretch"),
    createYogaStep(5, "Bridge", 40, "Lift"),
    createYogaStep(6, "Supine Stretch", 41, "Relax"),
    createYogaStep(7, "Relax Pose", 42, "Deep rest"),

    createMedStep(8, "Calm Visualization", 36, "Peaceful place"),
    createMedStep(9, "Light Visualization", 37, "Light inside"),
    createMedStep(10, "Success Vision", 38, "See success"),
    createMedStep(11, "Future Self", 39, "Best version"),
    createMedStep(12, "Energy Light", 40, "Feel light"),
    createMedStep(13, "Mind Clarity", 41, "Clear mind"),
    createMedStep(14, "Deep Visualization", 42, "Feel real")
  ],

  /* -------- DAY 7 -------- */
  7: [
    createYogaStep(1, "Full Body Flow", 43, "Flow"),
    createYogaStep(2, "Balance Pose", 44, "Focus"),
    createYogaStep(3, "Plank Hold", 45, "Strong"),
    createYogaStep(4, "Cobra", 46, "Open"),
    createYogaStep(5, "Camel Pose", 47, "Backbend"),
    createYogaStep(6, "Warrior Pose", 48, "Power"),
    createYogaStep(7, "Deep Relaxation", 49, "Rest"),

    createMedStep(8, "Silent Awareness", 43, "Observe"),
    createMedStep(9, "Deep Stillness", 44, "Still"),
    createMedStep(10, "Breath + Silence", 45, "Calm"),
    createMedStep(11, "Inner Balance", 46, "Balance"),
    createMedStep(12, "Calm Mind", 47, "Peace"),
    createMedStep(13, "Peaceful State", 48, "Relax"),
    createMedStep(14, "Deep Relaxation", 49, "Complete calm")
  ]
};

/* ---------------- GET SESSION ---------------- */

export const getSessionSteps = (day = 1) => {
  return DAY_SESSIONS[day] || [];
};
