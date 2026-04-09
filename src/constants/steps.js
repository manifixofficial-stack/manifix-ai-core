// src/constants/steps.js

/* ---------------- CONFIG ---------------- */
export const TOTAL_WEEKS = 4;
export const STEPS_PER_SESSION = 8;

/* ---------------- HELPER FUNCTIONS ---------------- */

// Get image path from public folder
export const getImagePath = (filename) => `/assets/steps/${filename}`;

// Daily variation (1–3) for slight changes
export const getVariation = () => (new Date().getDate() % 3) + 1;

// Build image name based on type, week, day, step, variation
export const buildImage = (type, week, day, step) => {
  const v = getVariation();
  return `${type}-w${week}-d${day}-s${step}-v${v}.png`;
};

export const WEEK_STEPS = {
1: {
  1: [
  // Yoga – 8 minutes total (~30–60 sec per pose)
  { name: "Mountain Pose", type: "yoga", img: "yoga1", text: "Stand tall, feet grounded, arms relaxed. Feel your body alignment.", duration: 30, step: 1 },
  { name: "Forward Fold", type: "yoga", img: "yoga2", text: "Hinge at hips, relax your spine, let head hang.", duration: 45, step: 2 },
  { name: "Half Lift", type: "yoga", img: "yoga3", text: "Lengthen your back, engage core, gaze forward.", duration: 30, step: 3 },
  { name: "Plank Pose", type: "yoga", img: "yoga4", text: "Engage core, keep body straight, breathe steadily.", duration: 45, step: 4 },
  { name: "Cobra Pose", type: "yoga", img: "yoga5", text: "Open chest, gently arch back, shoulders relaxed.", duration: 30, step: 5 },
  { name: "Downward Dog", type: "yoga", img: "yoga6", text: "Push hips up, stretch entire body, breathe deeply.", duration: 45, step: 6 },
  { name: "Tree Pose", type: "yoga", img: "yoga8", text: "Balance on one leg, focus gaze, feel grounded.", duration: 30, step: 7 },
  { name: "Warrior One", type: "yoga", img: "yoga71", text: "Step forward, arms up, feel strong and centered.", duration: 45, step: 8 },

  // Meditation – 8 minutes total (~60 sec per step)
  { name: "Calm Breathing", type: "meditation", img: "med1", text: "Close your eyes, inhale deeply, exhale slowly.", duration: 60, step: 9 },
  { name: "Focus Breath", type: "meditation", img: "med2", text: "Pay attention to your breathing rhythm, stay present.", duration: 60, step: 10 },
  { name: "Release Tension", type: "meditation", img: "med3", text: "Scan body, release tightness, feel lightness.", duration: 60, step: 11 },
  { name: "Feel Calm", type: "meditation", img: "med4", text: "Let thoughts pass gently, relax mind and body.", duration: 60, step: 12 },
  { name: "Let Thoughts Pass", type: "meditation", img: "med5", text: "Observe thoughts without judgment, breathe steadily.", duration: 60, step: 13 },
  { name: "Stay Present", type: "meditation", img: "med6", text: "Focus on your body sensations and breathing.", duration: 60, step: 14 },
  { name: "Visualize Success", type: "meditation", img: "med7", text: "Imagine a calm, confident, and focused version of yourself.", duration: 60, step: 15 },
  { name: "Deep Calm", type: "meditation", img: "med1", text: "Return to deep steady breaths, let your body absorb calmness.", duration: 60, step: 16 }
]
 2: [
  // Yoga – 8 minutes total (~30–60 sec per pose)
  { name: "Cat-Cow Pose", type: "yoga", img: "yoga7", text: "Alternate arching and rounding your back to release tension.", duration: 45, step: 1 },
  { name: "Seated Forward Bend", type: "yoga", img: "yoga2", text: "Stretch your hamstrings and spine while breathing deeply.", duration: 45, step: 2 },
  { name: "Low Lunge", type: "yoga", img: "yoga71", text: "Open hips and lengthen your legs.", duration: 45, step: 3 },
  { name: "Side Angle Pose", type: "yoga", img: "yoga72", text: "Stretch side body and strengthen legs.", duration: 45, step: 4 },
  { name: "Bridge Pose", type: "yoga", img: "yoga73", text: "Lift hips, open chest, engage glutes.", duration: 45, step: 5 },
  { name: "Supine Twist", type: "yoga", img: "yoga8", text: "Twist your spine gently, release tension.", duration: 45, step: 6 },
  { name: "Seated Side Stretch", type: "yoga", img: "yoga3", text: "Stretch your side body and shoulders.", duration: 45, step: 7 },
  { name: "Child’s Pose", type: "yoga", img: "yoga4", text: "Relax and breathe into your back and shoulders.", duration: 30, step: 8 },

  // Meditation – 8 minutes total (~60 sec per step)
  { name: "Mindful Breathing", type: "meditation", img: "med1", text: "Focus on slow, steady breaths, feel the air enter and leave.", duration: 60, step: 9 },
  { name: "Body Scan", type: "meditation", img: "med2", text: "Notice sensations from head to toe, release tension.", duration: 60, step: 10 },
  { name: "Gratitude Pause", type: "meditation", img: "med5", text: "Think of 3 things you are grateful for.", duration: 60, step: 11 },
  { name: "Calm Visualization", type: "meditation", img: "med6", text: "Visualize a peaceful place, feel calm and safe.", duration: 60, step: 12 },
  { name: "Focus Awareness", type: "meditation", img: "med7", text: "Bring attention to your present sensations without judgment.", duration: 60, step: 13 },
  { name: "Breath Counting", type: "meditation", img: "med3", text: "Count your breaths up to 10 and start over, staying mindful.", duration: 60, step: 14 },
  { name: "Release Thoughts", type: "meditation", img: "med4", text: "Let each thought pass like clouds, return to your breath.", duration: 60, step: 15 },
  { name: "Silent Presence", type: "meditation", img: "med1", text: "Sit quietly, absorb calm energy, feel rejuvenated.", duration: 60, step: 16 }
]
3: [
  // Yoga – 8 minutes total (~30–60 sec per pose)
  { name: "Wide-Leg Forward Fold", type: "yoga", img: "yoga2", text: "Stretch your legs and spine, breathe deeply.", duration: 45, step: 1 },
  { name: "Low Lunge Twist", type: "yoga", img: "yoga71", text: "Open hips and twist gently for spine release.", duration: 45, step: 2 },
  { name: "Seated Side Bend", type: "yoga", img: "yoga3", text: "Stretch side body and shoulders.", duration: 45, step: 3 },
  { name: "Bridge Pose", type: "yoga", img: "yoga73", text: "Lift hips and open chest for energy flow.", duration: 45, step: 4 },
  { name: "Legs-Up-The-Wall", type: "yoga", img: "yoga8", text: "Relax legs and calm the nervous system.", duration: 45, step: 5 },
  { name: "Cat-Cow Flow", type: "yoga", img: "yoga4", text: "Alternate arching and rounding your spine.", duration: 45, step: 6 },
  { name: "Garland Pose", type: "yoga", img: "yoga5", text: "Deep squat to open hips and center energy.", duration: 45, step: 7 },
  { name: "Child’s Pose", type: "yoga", img: "yoga6", text: "Relax fully and breathe into your back.", duration: 30, step: 8 },

  // Meditation – 8 minutes total (~60 sec per step)
  { name: "Mindful Breathing", type: "meditation", img: "med1", text: "Focus on slow breaths, feel calm.", duration: 60, step: 9 },
  { name: "Body Awareness", type: "meditation", img: "med2", text: "Notice sensations, release tension.", duration: 60, step: 10 },
  { name: "Positive Visualization", type: "meditation", img: "med3", text: "Visualize success and serenity.", duration: 60, step: 11 },
  { name: "Gratitude Focus", type: "meditation", img: "med4", text: "Think of things you are grateful for.", duration: 60, step: 12 },
  { name: "Breath Counting", type: "meditation", img: "med5", text: "Count your breaths to stay present.", duration: 60, step: 13 },
  { name: "Inner Calm Scan", type: "meditation", img: "med6", text: "Scan body and mind, release stress.", duration: 60, step: 14 },
  { name: "Silent Awareness", type: "meditation", img: "med7", text: "Sit in silence, absorb calm energy.", duration: 60, step: 15 },
  { name: "Mind Reset", type: "meditation", img: "med1", text: "Reset thoughts, feel refreshed.", duration: 60, step: 16 }
]
4: [
  // Yoga – 8 minutes total (~45–60 sec per pose)
  { name: "Seated Forward Bend", type: "yoga", img: "yoga2", text: "Stretch your hamstrings and spine.", duration: 50, step: 1 },
  { name: "Side Plank", type: "yoga", img: "yoga4", text: "Strengthen arms and core, balance.", duration: 50, step: 2 },
  { name: "Wide-Leg Squat", type: "yoga", img: "yoga73", text: "Open hips and stabilize posture.", duration: 50, step: 3 },
  { name: "Camel Pose", type: "yoga", img: "yoga5", text: "Open chest and shoulders deeply.", duration: 50, step: 4 },
  { name: "Standing Side Stretch", type: "yoga", img: "yoga71", text: "Lengthen your side body gently.", duration: 50, step: 5 },
  { name: "Cat-Cow Flow", type: "yoga", img: "yoga3", text: "Mobilize spine and relax back.", duration: 50, step: 6 },
  { name: "Revolved Chair Pose", type: "yoga", img: "yoga8", text: "Twist torso and strengthen legs.", duration: 50, step: 7 },
  { name: "Happy Baby Pose", type: "yoga", img: "yoga6", text: "Release lower back tension.", duration: 30, step: 8 },

  // Meditation – 8 minutes total (~60 sec per step)
  { name: "Grounding Breath", type: "meditation", img: "med2", text: "Focus on steady, deep breathing.", duration: 60, step: 9 },
  { name: "Body Relax Scan", type: "meditation", img: "med3", text: "Notice areas of tension and release.", duration: 60, step: 10 },
  { name: "Positive Affirmation", type: "meditation", img: "med4", text: "Repeat affirmations silently.", duration: 60, step: 11 },
  { name: "Calm Visualization", type: "meditation", img: "med5", text: "Visualize peaceful imagery.", duration: 60, step: 12 },
  { name: "Focus on Heartbeat", type: "meditation", img: "med6", text: "Feel calm through your heartbeat.", duration: 60, step: 13 },
  { name: "Letting Go Breath", type: "meditation", img: "med7", text: "Exhale tension fully.", duration: 60, step: 14 },
  { name: "Mindful Awareness", type: "meditation", img: "med1", text: "Observe thoughts without judgment.", duration: 60, step: 15 },
  { name: "Inner Peace", type: "meditation", img: "med2", text: "Absorb calm energy fully.", duration: 60, step: 16 }
]
5: [
  // Yoga – 8 minutes total (~50–60 sec per pose)
  { name: "Wide-Leg Forward Fold", type: "yoga", img: "yoga2", text: "Stretch inner thighs and spine.", duration: 50, step: 1 },
  { name: "Revolved Triangle", type: "yoga", img: "yoga3", text: "Twist torso gently, open chest.", duration: 50, step: 2 },
  { name: "Chair Pose", type: "yoga", img: "yoga71", text: "Strengthen legs and core.", duration: 50, step: 3 },
  { name: "Low Lunge Twist", type: "yoga", img: "yoga72", text: "Open hips and spine.", duration: 50, step: 4 },
  { name: "Seated Side Stretch", type: "yoga", img: "yoga73", text: "Lengthen side body gently.", duration: 50, step: 5 },
  { name: "Bridge Pose", type: "yoga", img: "yoga4", text: "Open chest and strengthen back.", duration: 50, step: 6 },
  { name: "Legs Up Wall Pose", type: "yoga", img: "yoga6", text: "Relax legs and lower back.", duration: 50, step: 7 },
  { name: "Child's Pose", type: "yoga", img: "yoga8", text: "Release spine tension fully.", duration: 30, step: 8 },

  // Meditation – 8 minutes total (~60 sec each)
  { name: "Deep Breath Awareness", type: "meditation", img: "med1", text: "Focus on calm, steady breathing.", duration: 60, step: 9 },
  { name: "Mindful Observation", type: "meditation", img: "med4", text: "Observe thoughts without attachment.", duration: 60, step: 10 },
  { name: "Body Relaxation Scan", type: "meditation", img: "med5", text: "Release tension from head to toe.", duration: 60, step: 11 },
  { name: "Calm Visualization", type: "meditation", img: "med6", text: "Visualize a peaceful place.", duration: 60, step: 12 },
  { name: "Heart Center Focus", type: "meditation", img: "med7", text: "Feel calm energy in your chest.", duration: 60, step: 13 },
  { name: "Letting Go Practice", type: "meditation", img: "med2", text: "Exhale worries completely.", duration: 60, step: 14 },
  { name: "Mindful Presence", type: "meditation", img: "med3", text: "Be fully aware of the present moment.", duration: 60, step: 15 },
  { name: "Inner Calm Absorption", type: "meditation", img: "med4", text: "Feel serenity throughout your body.", duration: 60, step: 16 }
]
    6: [
  // Yoga – 8 minutes total (~50–60 sec per pose)
  { name: "Wide-Leg Forward Fold", type: "yoga", img: "yoga2", text: "Stretch hamstrings and spine deeply.", duration: 50, step: 1 },
  { name: "Chair Twist", type: "yoga", img: "yoga73", text: "Twist torso to energize body.", duration: 50, step: 2 },
  { name: "Bridge Pose", type: "yoga", img: "yoga4", text: "Open chest and strengthen back.", duration: 50, step: 3 },
  { name: "Low Lunge Reach", type: "yoga", img: "yoga72", text: "Stretch hip flexors and arms.", duration: 50, step: 4 },
  { name: "Seated Forward Fold", type: "yoga", img: "yoga3", text: "Relax spine and hamstrings.", duration: 50, step: 5 },
  { name: "Legs Up Wall Pose", type: "yoga", img: "yoga6", text: "Relax legs and lower back.", duration: 50, step: 6 },
  { name: "Reclined Bound Angle", type: "yoga", img: "yoga8", text: "Open hips and calm mind.", duration: 50, step: 7 },
  { name: "Child's Pose", type: "yoga", img: "yoga71", text: "Release tension fully.", duration: 30, step: 8 },

  // Meditation – 8 minutes total (~60 sec each)
  { name: "Deep Abdominal Breathing", type: "meditation", img: "med1", text: "Focus on slow, deep breaths.", duration: 60, step: 9 },
  { name: "Body Awareness Scan", type: "meditation", img: "med2", text: "Notice and relax every body part.", duration: 60, step: 10 },
  { name: "Calm Visualization", type: "meditation", img: "med3", text: "Visualize a serene place.", duration: 60, step: 11 },
  { name: "Mindful Listening", type: "meditation", img: "med4", text: "Focus on surrounding sounds without judgment.", duration: 60, step: 12 },
  { name: "Letting Go Meditation", type: "meditation", img: "med5", text: "Release all tension with exhale.", duration: 60, step: 13 },
  { name: "Heart Center Awareness", type: "meditation", img: "med6", text: "Feel calm energy at your chest.", duration: 60, step: 14 },
  { name: "Present Moment Focus", type: "meditation", img: "med7", text: "Anchor attention in now.", duration: 60, step: 15 },
  { name: "Serenity Absorption", type: "meditation", img: "med1", text: "Feel calm energy throughout your body.", duration: 60, step: 16 }
]
7: [
  // Yoga – 8 minutes total (~50–60 sec each)
  { name: "Cat-Cow Flow", type: "yoga", img: "yoga3", text: "Gently warm your spine with flowing movements.", duration: 50, step: 1 },
  { name: "Eagle Arms", type: "yoga", img: "yoga72", text: "Stretch shoulders and upper back.", duration: 50, step: 2 },
  { name: "Side Plank", type: "yoga", img: "yoga4", text: "Strengthen obliques and balance.", duration: 50, step: 3 },
  { name: "Seated Twist", type: "yoga", img: "yoga73", text: "Twist torso for spinal mobility.", duration: 50, step: 4 },
  { name: "Half Lord of the Fishes Pose", type: "yoga", img: "yoga6", text: "Stretch spine and shoulders deeply.", duration: 50, step: 5 },
  { name: "Supported Bridge", type: "yoga", img: "yoga5", text: "Open chest and strengthen back.", duration: 50, step: 6 },
  { name: "Wide-Leg Child's Pose", type: "yoga", img: "yoga8", text: "Relax hips and spine completely.", duration: 50, step: 7 },
  { name: "Reclining Twist", type: "yoga", img: "yoga71", text: "Release tension in spine and hips.", duration: 40, step: 8 },

  // Meditation – 8 minutes total (~60 sec each)
  { name: "Grounding Breath", type: "meditation", img: "med1", text: "Feel connection with the ground.", duration: 60, step: 9 },
  { name: "Visualization of Light", type: "meditation", img: "med2", text: "Imagine calm light filling your body.", duration: 60, step: 10 },
  { name: "Awareness of Heartbeat", type: "meditation", img: "med3", text: "Focus on gentle rhythm of your heartbeat.", duration: 60, step: 11 },
  { name: "Mindful Observation", type: "meditation", img: "med4", text: "Notice thoughts without attachment.", duration: 60, step: 12 },
  { name: "Progressive Relaxation", type: "meditation", img: "med5", text: "Relax muscles from head to toe.", duration: 60, step: 13 },
  { name: "Breathing with Counting", type: "meditation", img: "med6", text: "Count breaths to calm mind.", duration: 60, step: 14 },
  { name: "Silent Awareness", type: "meditation", img: "med7", text: "Sit in stillness, noticing sensations.", duration: 60, step: 15 },
  { name: "Energy Reset", type: "meditation", img: "med1", text: "Feel renewed energy through your body.", duration: 60, step: 16 }
]
  }
};

/* ---------------- MAIN FUNCTION ---------------- */
export const getSessionSteps = (week = 1) => {
  const today = new Date().getDay(); 
  const day = today === 0 ? 7 : today; // Sunday = 7

  const weekData = WEEK_STEPS[week] || WEEK_STEPS[1];
  const steps = weekData[day];

  return steps.map((step, index) => {
    const stepNumber = index + 1;

    return {
      ...step,
      image: getImagePath(buildImage(step.type, week, day, stepNumber))
    };
  });
};
