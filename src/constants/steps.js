// src/constants/steps.js

export const TOTAL_DAYS = 7;
export const STEPS_PER_DAY = 7;

/* ---------------- IMAGE PATH ---------------- */
const getImage = (num) => `/assets/steps/yoga/yoga-${String(num).padStart(2, "0")}.jpg`;

/* ---------------- STEP BUILDER ---------------- */
const createStep = (step, name, imageNum, guidance, duration = 30) => ({
  step,
  name,
  image: getImage(imageNum),
  guidance,
  duration,
  type: "yoga"
});

/* ---------------- DAY SESSIONS ---------------- */

export const DAY_SESSIONS = {

  /* -------- DAY 1 -------- */
  1: [
    createStep(1, "Mountain Pose", 1, "Stand tall, feet together, relax shoulders, breathe deeply"),
    createStep(2, "Forward Fold", 2, "Bend forward, relax neck, let arms hang"),
    createStep(3, "Half Lift", 3, "Lift halfway, keep spine straight"),
    createStep(4, "Plank", 4, "Hold body straight, engage core"),
    createStep(5, "Cobra", 5, "Lift chest, open shoulders"),
    createStep(6, "Downward Dog", 6, "Push hips up, stretch back"),
    createStep(7, "Child Pose", 7, "Sit back, relax body, slow breathing")
  ],

  /* -------- DAY 2 -------- */
  2: [
    createStep(1, "Cat-Cow", 8, "Inhale arch, exhale round spine"),
    createStep(2, "Low Lunge", 9, "Step forward, open hips"),
    createStep(3, "Warrior I", 10, "Raise arms, bend front knee"),
    createStep(4, "Warrior II", 11, "Open arms wide, gaze forward"),
    createStep(5, "Triangle Pose", 12, "Stretch sideways, reach down"),
    createStep(6, "Tree Pose", 13, "Balance on one leg, focus"),
    createStep(7, "Seated Forward Fold", 14, "Reach forward, relax spine")
  ],

  /* -------- DAY 3 -------- */
  3: [
    createStep(1, "Sun Salutation Flow", 15, "Flow smoothly with breath"),
    createStep(2, "Plank Hold", 16, "Hold strong, steady breathing"),
    createStep(3, "Side Plank", 17, "Balance sideways, engage core"),
    createStep(4, "Cobra Lift", 18, "Lift chest gently"),
    createStep(5, "Bridge Pose", 19, "Lift hips, squeeze glutes"),
    createStep(6, "Supine Twist", 20, "Twist gently, relax spine"),
    createStep(7, "Relax Pose", 21, "Lie down, release tension")
  ],

  /* -------- DAY 4 -------- */
  4: [
    createStep(1, "Standing Stretch", 22, "Stretch arms upward"),
    createStep(2, "Chair Pose", 23, "Sit back, arms up"),
    createStep(3, "Eagle Arms", 24, "Wrap arms, stretch shoulders"),
    createStep(4, "Warrior III", 25, "Balance forward, extend leg"),
    createStep(5, "Half Moon", 26, "Open body sideways"),
    createStep(6, "Pyramid Pose", 27, "Fold forward, stretch legs"),
    createStep(7, "Child Pose", 28, "Relax deeply")
  ],

  /* -------- DAY 5 -------- */
  5: [
    createStep(1, "Warm Up Flow", 29, "Start gentle movements"),
    createStep(2, "Forward Fold", 30, "Release tension"),
    createStep(3, "Plank", 31, "Engage core"),
    createStep(4, "Upward Dog", 32, "Open chest"),
    createStep(5, "Downward Dog", 33, "Stretch body"),
    createStep(6, "Tree Pose", 34, "Balance and focus"),
    createStep(7, "Seated Twist", 35, "Twist spine gently")
  ],

  /* -------- DAY 6 -------- */
  6: [
    createStep(1, "Sun Flow", 36, "Move with breath"),
    createStep(2, "Low Lunge", 37, "Open hips"),
    createStep(3, "Warrior Flow", 38, "Flow through poses"),
    createStep(4, "Triangle", 39, "Stretch sideways"),
    createStep(5, "Bridge", 40, "Lift hips"),
    createStep(6, "Supine Stretch", 41, "Relax muscles"),
    createStep(7, "Relax Pose", 42, "Deep relaxation")
  ],

  /* -------- DAY 7 -------- */
  7: [
    createStep(1, "Full Body Flow", 43, "Flow smoothly"),
    createStep(2, "Balance Pose", 44, "Focus and balance"),
    createStep(3, "Plank Hold", 45, "Strong core"),
    createStep(4, "Cobra", 46, "Open chest"),
    createStep(5, "Camel Pose", 47, "Backbend, open heart"), // updated
    createStep(6, "Warrior Pose", 48, "Power and stability"),
    createStep(7, "Deep Relaxation", 49, "Full body rest, calm mind")
  ]
};

/* ---------------- GET SESSION ---------------- */

export const getSessionSteps = (day = 1) => {
  return DAY_SESSIONS[day] || [];
};
