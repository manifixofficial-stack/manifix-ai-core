// src/constants/steps.js

/* ---------------- CONFIG ---------------- */

export const TOTAL_WEEKS = 4;
export const STEPS_PER_SESSION = 8;

/* ---------------- HELPER FUNCTIONS ---------------- */

// Get image path
export const getImagePath = (name) => `/assets/steps/${name}`;

// Daily variation (1–3)
export const getVariation = () => {
  return (new Date().getDate() % 3) + 1;
};

// Build image name
const buildImage = (type, week, day, step) => {
  const v = getVariation();
  return `${type}-w${week}-d${day}-s${step}-v${v}.png`;
};

/* ---------------- WEEKLY STEP DATA ---------------- */

export const WEEK_STEPS = {
  1: {
    1: [
      { name: "Calm Breathing", type: "med", target: "calm", step: 1 },
      { name: "Neck Stretch", type: "yoga", target: "stretch", step: 2 },
      { name: "Half Lift", type: "yoga", target: "straight_back", step: 3 },
      { name: "Arm Stretch", type: "yoga", target: "stretch", step: 4 },
      { name: "Plank Intro", type: "yoga", target: "plank", step: 5 },
      { name: "Deep Breathing", type: "med", target: "stillness", step: 6 },
      { name: "Forward Fold", type: "yoga", target: "stretch", step: 7 },
      { name: "Meditation Calm", type: "med", target: "stillness", step: 8 }
    ],

    2: [
      { name: "Focus Breath", type: "med", target: "calm", step: 1 },
      { name: "Shoulder Stretch", type: "yoga", target: "stretch", step: 2 },
      { name: "Back Alignment", type: "yoga", target: "straight_back", step: 3 },
      { name: "Side Stretch", type: "yoga", target: "stretch", step: 4 },
      { name: "Plank Hold", type: "yoga", target: "plank", step: 5 },
      { name: "Slow Breathing", type: "med", target: "stillness", step: 6 },
      { name: "Hamstring Stretch", type: "yoga", target: "stretch", step: 7 },
      { name: "Silent Meditation", type: "med", target: "stillness", step: 8 }
    ],

    3: [
      { name: "Mind Reset", type: "med", target: "calm", step: 1 },
      { name: "Dynamic Stretch", type: "yoga", target: "stretch", step: 2 },
      { name: "Spine Control", type: "yoga", target: "straight_back", step: 3 },
      { name: "Arm Flow", type: "yoga", target: "stretch", step: 4 },
      { name: "Core Plank", type: "yoga", target: "plank", step: 5 },
      { name: "Deep Calm", type: "med", target: "stillness", step: 6 },
      { name: "Full Stretch", type: "yoga", target: "stretch", step: 7 },
      { name: "Zen Mode", type: "med", target: "stillness", step: 8 }
    ],

    4: [
      { name: "Breath Control", type: "med", target: "calm", step: 1 },
      { name: "Full Body Stretch", type: "yoga", target: "stretch", step: 2 },
      { name: "Posture Fix", type: "yoga", target: "straight_back", step: 3 },
      { name: "Mobility Flow", type: "yoga", target: "stretch", step: 4 },
      { name: "Strong Plank", type: "yoga", target: "plank", step: 5 },
      { name: "Still Breathing", type: "med", target: "stillness", step: 6 },
      { name: "Deep Extension", type: "yoga", target: "stretch", step: 7 },
      { name: "Calm Meditation", type: "med", target: "stillness", step: 8 }
    ],

    5: [
      { name: "Relax Breath", type: "med", target: "calm", step: 1 },
      { name: "Stretch Flow", type: "yoga", target: "stretch", step: 2 },
      { name: "Back Strength", type: "yoga", target: "straight_back", step: 3 },
      { name: "Arm Mobility", type: "yoga", target: "stretch", step: 4 },
      { name: "Plank Stability", type: "yoga", target: "plank", step: 5 },
      { name: "Silent Breath", type: "med", target: "stillness", step: 6 },
      { name: "Forward Stretch", type: "yoga", target: "stretch", step: 7 },
      { name: "Mind Calm", type: "med", target: "stillness", step: 8 }
    ],

    6: [
      { name: "Focus Reset", type: "med", target: "calm", step: 1 },
      { name: "Deep Stretch", type: "yoga", target: "stretch", step: 2 },
      { name: "Posture Align", type: "yoga", target: "straight_back", step: 3 },
      { name: "Arm Flow+", type: "yoga", target: "stretch", step: 4 },
      { name: "Power Plank", type: "yoga", target: "plank", step: 5 },
      { name: "Still Mind", type: "med", target: "stillness", step: 6 },
      { name: "Full Extension", type: "yoga", target: "stretch", step: 7 },
      { name: "Deep Meditation", type: "med", target: "stillness", step: 8 }
    ],

    7: [
      { name: "Master Breath", type: "med", target: "calm", step: 1 },
      { name: "Full Flow Stretch", type: "yoga", target: "stretch", step: 2 },
      { name: "Perfect Posture", type: "yoga", target: "straight_back", step: 3 },
      { name: "Mobility Master", type: "yoga", target: "stretch", step: 4 },
      { name: "Ultimate Plank", type: "yoga", target: "plank", step: 5 },
      { name: "Stillness Master", type: "med", target: "stillness", step: 6 },
      { name: "Deep Flow", type: "yoga", target: "stretch", step: 7 },
      { name: "Zen Master", type: "med", target: "stillness", step: 8 }
    ]
  };

/* ---------------- MAIN FUNCTION ---------------- */

export const getSessionSteps = (week = 1) => {
  const today = new Date().getDay(); 
  const day = today === 0 ? 7 : today; // Sunday fix

  const weekData = WEEK_STEPS[week] || WEEK_STEPS[1];
  const steps = weekData[day];

  return steps.map((step, index) => {
    const stepNumber = index + 1;

    return {
      ...step,
      image: getImagePath(
        buildImage(step.type, week, stepNumber)
      )
    };
  });
};
