// src/constants/steps.js
// ManifiX AI — Magic16 Program
// 16 Days × 14 Steps per Day (7 Yoga + 7 Meditation)
// 8 mins Yoga + 8 mins Meditation = 16 mins total

export const TOTAL_DAYS = 16;
export const TOTAL_STEPS_PER_DAY = 14;

/* ─────────────────────────────────────────
   IMAGE PATH HELPERS
───────────────────────────────────────── */
const yoga = (num) => `/assets/steps/yoga/yoga-${String(num).padStart(2, "0")}.jpg`;
const med  = (num) => `/assets/steps/med/med-${String(num).padStart(2, "0")}.jpg`;

/* ─────────────────────────────────────────
   STEP SCHEMA
   {
     id:        unique string
     phase:     "yoga" | "meditation"
     name:      display name
     duration:  seconds (yoga ~68s × 7 = 476s ≈ 8min, med ~68s × 7 = 476s ≈ 8min)
     cue:       voice guidance text
     image:     image path
     keyPoints: scoring landmarks (for MoveNet)
   }
───────────────────────────────────────── */

const ALL_DAYS = [

  /* ══════════════════════════════════════
     DAY 1 — AWAKENING
  ══════════════════════════════════════ */
  [
    { id:"d1-y1", phase:"yoga",       name:"Mountain Pose",          duration:68, cue:"Stand tall, feet together, arms at sides. Breathe in your power.",       image:yoga(1),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d1-y2", phase:"yoga",       name:"Raised Arms Pose",       duration:68, cue:"Inhale, sweep arms overhead. Lift your chest, gaze forward.",             image:yoga(2),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d1-y3", phase:"yoga",       name:"Forward Fold",           duration:68, cue:"Exhale, hinge at hips. Let your head hang heavy. Release tension.",       image:yoga(3),  keyPoints:["left_hip","right_hip","left_knee","right_knee"] },
    { id:"d1-y4", phase:"yoga",       name:"Low Lunge — Right",      duration:68, cue:"Step right foot back. Sink your hips. Open your heart forward.",          image:yoga(4),  keyPoints:["right_knee","left_knee","left_hip","right_hip"] },
    { id:"d1-y5", phase:"yoga",       name:"Downward Dog",           duration:68, cue:"Press hips high. Heels reach toward the floor. Long spine.",              image:yoga(5),  keyPoints:["left_wrist","right_wrist","left_ankle","right_ankle"] },
    { id:"d1-y6", phase:"yoga",       name:"Child's Pose",           duration:68, cue:"Sink back onto your heels. Arms reach long. Total surrender.",            image:yoga(6),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d1-y7", phase:"yoga",       name:"Cat-Cow Flow",           duration:68, cue:"Hands and knees. Inhale arch, exhale round. Move with your breath.",      image:yoga(7),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d1-m1", phase:"meditation", name:"Breath Awareness",       duration:68, cue:"Close your eyes. Feel your breath. In through the nose, out through the nose.", image:med(1), keyPoints:[] },
    { id:"d1-m2", phase:"meditation", name:"Body Scan — Head",       duration:68, cue:"Bring attention to your scalp, forehead, jaw. Release every muscle.",    image:med(2),  keyPoints:[] },
    { id:"d1-m3", phase:"meditation", name:"Body Scan — Chest",      duration:68, cue:"Notice your heart beating. Feel your chest rise and fall. Stay.",         image:med(3),  keyPoints:[] },
    { id:"d1-m4", phase:"meditation", name:"Body Scan — Belly",      duration:68, cue:"Let your belly soften. Breathe deep into the abdomen. No effort.",        image:med(4),  keyPoints:[] },
    { id:"d1-m5", phase:"meditation", name:"Body Scan — Legs",       duration:68, cue:"Feel weight in your thighs, calves, feet. You are grounded.",             image:med(5),  keyPoints:[] },
    { id:"d1-m6", phase:"meditation", name:"Gratitude Anchor",       duration:68, cue:"Think of one thing you are grateful for today. Hold it.",                 image:med(6),  keyPoints:[] },
    { id:"d1-m7", phase:"meditation", name:"Return & Seal",          duration:68, cue:"Wiggle your fingers. Take a deep breath. Open your eyes when ready.",     image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 2 — FOUNDATION
  ══════════════════════════════════════ */
  [
    { id:"d2-y1", phase:"yoga",       name:"Warrior I — Left",       duration:68, cue:"Left foot forward, right foot back at 45°. Raise arms overhead. Hold.",   image:yoga(8),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d2-y2", phase:"yoga",       name:"Warrior I — Right",      duration:68, cue:"Switch sides. Right foot forward. Square your hips. Breathe into it.",    image:yoga(9),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d2-y3", phase:"yoga",       name:"Warrior II — Left",      duration:68, cue:"Open arms to sides. Gaze over left fingertips. Strong legs.",             image:yoga(10), keyPoints:["left_wrist","right_wrist","left_knee","right_knee"] },
    { id:"d2-y4", phase:"yoga",       name:"Warrior II — Right",     duration:68, cue:"Switch to right. Sink the front knee. Feel the burn. Stay present.",      image:yoga(11), keyPoints:["left_wrist","right_wrist","left_knee","right_knee"] },
    { id:"d2-y5", phase:"yoga",       name:"Triangle Pose — Left",   duration:68, cue:"Straighten legs. Reach left hand down, right arm up. Long side body.",    image:yoga(12), keyPoints:["left_ankle","right_ankle","left_wrist","right_wrist"] },
    { id:"d2-y6", phase:"yoga",       name:"Triangle Pose — Right",  duration:68, cue:"Now right side. Stack your hips. Open your chest to the sky.",            image:yoga(13), keyPoints:["left_ankle","right_ankle","left_wrist","right_wrist"] },
    { id:"d2-y7", phase:"yoga",       name:"Wide-Legged Forward Fold",duration:68,cue:"Feet wide. Fold from hips, crown toward the floor. Let go.",              image:yoga(14), keyPoints:["left_hip","right_hip","left_ankle","right_ankle"] },
    { id:"d2-m1", phase:"meditation", name:"4-7-8 Breathing",        duration:68, cue:"Inhale 4 counts. Hold 7. Exhale 8. This activates your calm.",            image:med(8),  keyPoints:[] },
    { id:"d2-m2", phase:"meditation", name:"4-7-8 Round 2",          duration:68, cue:"Again. In for 4. Hold for 7. Out for 8. Feel your nervous system settle.", image:med(9),  keyPoints:[] },
    { id:"d2-m3", phase:"meditation", name:"4-7-8 Round 3",          duration:68, cue:"One more round. Inhale 4. Hold 7. Exhale 8. You're doing great.",         image:med(10), keyPoints:[] },
    { id:"d2-m4", phase:"meditation", name:"Mindful Seeing",         duration:68, cue:"Open your eyes softly. Notice colors. Notice light. Just observe.",       image:med(11), keyPoints:[] },
    { id:"d2-m5", phase:"meditation", name:"Mindful Hearing",        duration:68, cue:"Close eyes again. What sounds exist right now? Near. Far. Between.",      image:med(12), keyPoints:[] },
    { id:"d2-m6", phase:"meditation", name:"Present Moment Anchor",  duration:68, cue:"You are here. This moment is real. Nothing else needs your attention.",   image:med(13), keyPoints:[] },
    { id:"d2-m7", phase:"meditation", name:"Closing Intention",      duration:68, cue:"Set one intention for today. Say it silently. Make it yours.",            image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 3 — BALANCE
  ══════════════════════════════════════ */
  [
    { id:"d3-y1", phase:"yoga",       name:"Tree Pose — Left",       duration:68, cue:"Balance on left foot. Right foot to inner thigh. Palms together at chest.", image:yoga(15), keyPoints:["left_knee","right_knee","left_ankle","right_ankle"] },
    { id:"d3-y2", phase:"yoga",       name:"Tree Pose — Right",      duration:68, cue:"Switch. Balance on right. Fix your gaze. A still mind finds stillness.",  image:yoga(16), keyPoints:["left_knee","right_knee","left_ankle","right_ankle"] },
    { id:"d3-y3", phase:"yoga",       name:"Eagle Arms",             duration:68, cue:"Cross left arm under right, wrap forearms. Lift elbows. Squeeze.",         image:yoga(17), keyPoints:["left_elbow","right_elbow","left_shoulder","right_shoulder"] },
    { id:"d3-y4", phase:"yoga",       name:"Chair Pose",             duration:68, cue:"Feet together, bend knees, sit back. Arms reach up. Thighs burn. Good.",  image:yoga(18), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d3-y5", phase:"yoga",       name:"Standing Forward Fold",  duration:68, cue:"Fold deep. Grab opposite elbows. Sway gently side to side.",              image:yoga(19), keyPoints:["left_hip","right_hip","left_knee","right_knee"] },
    { id:"d3-y6", phase:"yoga",       name:"Halfway Lift",           duration:68, cue:"Flat back. Hands to shins. Look forward. Long spine. Engage your core.",  image:yoga(20), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d3-y7", phase:"yoga",       name:"Mountain Pose Hold",     duration:68, cue:"Return to mountain. Feel your feet on the ground. You are solid.",        image:yoga(1),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d3-m1", phase:"meditation", name:"Loving-Kindness — Self", duration:68, cue:"Repeat silently: May I be happy. May I be healthy. May I be at peace.",   image:med(1),  keyPoints:[] },
    { id:"d3-m2", phase:"meditation", name:"Loving-Kindness — Loved",duration:68, cue:"Think of someone you love. Send them: May you be happy. May you be well.", image:med(2),  keyPoints:[] },
    { id:"d3-m3", phase:"meditation", name:"Loving-Kindness — Neutral",duration:68,cue:"Think of someone neutral. Extend the same wish. May you be at peace.",   image:med(3),  keyPoints:[] },
    { id:"d3-m4", phase:"meditation", name:"Loving-Kindness — All",  duration:68, cue:"Expand to all beings everywhere. May all be happy. May all be free.",     image:med(4),  keyPoints:[] },
    { id:"d3-m5", phase:"meditation", name:"Heart Center Breath",    duration:68, cue:"Hand on heart. Feel warmth. Breathe in love. Breathe out love.",          image:med(5),  keyPoints:[] },
    { id:"d3-m6", phase:"meditation", name:"Compassion Hold",        duration:68, cue:"You deserve kindness. Everyone does. Hold that truth in your heart.",      image:med(6),  keyPoints:[] },
    { id:"d3-m7", phase:"meditation", name:"Seal with Warmth",       duration:68, cue:"Rub palms together. Cup your eyes. Absorb the warmth. Open gently.",      image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 4 — STRENGTH
  ══════════════════════════════════════ */
  [
    { id:"d4-y1", phase:"yoga",       name:"Plank Pose",             duration:68, cue:"Hands under shoulders. Body straight as a board. Hold. Breathe.",         image:yoga(2),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d4-y2", phase:"yoga",       name:"Side Plank — Left",      duration:68, cue:"Left hand down, stack feet. Right arm to sky. Hips stay high.",           image:yoga(3),  keyPoints:["left_wrist","left_shoulder","left_hip","left_ankle"] },
    { id:"d4-y3", phase:"yoga",       name:"Side Plank — Right",     duration:68, cue:"Switch. Right hand down. Body like a blade. Strong and still.",           image:yoga(4),  keyPoints:["right_wrist","right_shoulder","right_hip","right_ankle"] },
    { id:"d4-y4", phase:"yoga",       name:"Locust Pose",            duration:68, cue:"Lie on belly. Lift chest, arms, legs simultaneously. Back strength.",     image:yoga(5),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d4-y5", phase:"yoga",       name:"Bow Pose",               duration:68, cue:"Grab ankles, kick back. Chest lifts. Heart opens. Breathe wide.",         image:yoga(6),  keyPoints:["left_ankle","right_ankle","left_shoulder","right_shoulder"] },
    { id:"d4-y6", phase:"yoga",       name:"Bridge Pose",            duration:68, cue:"On back, feet flat, hips up. Press through your feet. Feel glutes fire.",  image:yoga(7),  keyPoints:["left_knee","right_knee","left_shoulder","right_shoulder"] },
    { id:"d4-y7", phase:"yoga",       name:"Supine Twist — Both",    duration:68, cue:"Hug knees in. Drop both knees left, then right. Spine releases.",         image:yoga(8),  keyPoints:["left_knee","right_knee","left_shoulder","right_shoulder"] },
    { id:"d4-m1", phase:"meditation", name:"Power Breath",           duration:68, cue:"Three deep power breaths. Fill completely. Release fully. Feel alive.",   image:med(8),  keyPoints:[] },
    { id:"d4-m2", phase:"meditation", name:"Inner Strength Visualization",duration:68,cue:"See yourself strong. Capable. Unshakeable. This is who you are.",     image:med(9),  keyPoints:[] },
    { id:"d4-m3", phase:"meditation", name:"Affirmation — I Am",     duration:68, cue:"Say silently: I am strong. I am disciplined. I am becoming more.",        image:med(10), keyPoints:[] },
    { id:"d4-m4", phase:"meditation", name:"Core Awareness",         duration:68, cue:"Feel your core center. Your foundation. Everything builds from here.",    image:med(11), keyPoints:[] },
    { id:"d4-m5", phase:"meditation", name:"Courage Meditation",     duration:68, cue:"Think of one thing you've been avoiding. Breathe courage into it.",        image:med(12), keyPoints:[] },
    { id:"d4-m6", phase:"meditation", name:"Release Fear",           duration:68, cue:"On each exhale, let fear dissolve. You are bigger than your fear.",       image:med(13), keyPoints:[] },
    { id:"d4-m7", phase:"meditation", name:"Champion Seal",          duration:68, cue:"Fists gently to chest. Feel your heartbeat. You showed up. That's power.", image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 5 — FLEXIBILITY
  ══════════════════════════════════════ */
  [
    { id:"d5-y1", phase:"yoga",       name:"Seated Forward Fold",    duration:68, cue:"Legs long, fold forward. Reach for feet. Let gravity do the work.",       image:yoga(9),  keyPoints:["left_hip","right_hip","left_knee","right_knee"] },
    { id:"d5-y2", phase:"yoga",       name:"Butterfly Pose",         duration:68, cue:"Soles of feet together. Let knees drop. Gently flutter like wings.",      image:yoga(10), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d5-y3", phase:"yoga",       name:"Pigeon Prep — Left",     duration:68, cue:"Left shin forward, right leg back. Fold over left leg. Deep hip release.", image:yoga(11), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d5-y4", phase:"yoga",       name:"Pigeon Prep — Right",    duration:68, cue:"Switch sides. Right shin forward. Breathe into the tightness. Stay.",     image:yoga(12), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d5-y5", phase:"yoga",       name:"Seated Spinal Twist — L",duration:68, cue:"Left leg extended, right foot outside left thigh. Twist right.",          image:yoga(13), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d5-y6", phase:"yoga",       name:"Seated Spinal Twist — R",duration:68, cue:"Switch. Twist to the left. Long spine. Look over left shoulder.",         image:yoga(14), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d5-y7", phase:"yoga",       name:"Happy Baby",             duration:68, cue:"On back, grab outer feet. Rock gently. Childlike ease. Smile if you can.", image:yoga(15), keyPoints:["left_knee","right_knee","left_ankle","right_ankle"] },
    { id:"d5-m1", phase:"meditation", name:"Release Meditation",     duration:68, cue:"What are you holding onto? Name it. Now imagine releasing it like a balloon.", image:med(1), keyPoints:[] },
    { id:"d5-m2", phase:"meditation", name:"Softening Breath",       duration:68, cue:"Each inhale — receive. Each exhale — let go. Nothing to hold. Nothing to fix.", image:med(2), keyPoints:[] },
    { id:"d5-m3", phase:"meditation", name:"Open Hand Practice",     duration:68, cue:"Open your palms face up. Feel what it means to be open, receptive.",      image:med(3),  keyPoints:[] },
    { id:"d5-m4", phase:"meditation", name:"Tension Map",            duration:68, cue:"Scan for any remaining tension. Send your breath there. Watch it soften.", image:med(4),  keyPoints:[] },
    { id:"d5-m5", phase:"meditation", name:"Flow Visualization",     duration:68, cue:"Imagine water flowing through you. Clearing. Cleaning. Moving freely.",   image:med(5),  keyPoints:[] },
    { id:"d5-m6", phase:"meditation", name:"Acceptance",             duration:68, cue:"Today is exactly as it should be. You are exactly where you need to be.",  image:med(6),  keyPoints:[] },
    { id:"d5-m7", phase:"meditation", name:"Soft Close",             duration:68, cue:"Long exhale. Settle deeper. You are flexible — in body and in mind.",     image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 6 — ENERGY
  ══════════════════════════════════════ */
  [
    { id:"d6-y1", phase:"yoga",       name:"Sun Salutation A — 1",   duration:68, cue:"Mountain. Reach up. Forward fold. Plank. Cobra. Downward dog.",            image:yoga(16), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d6-y2", phase:"yoga",       name:"Sun Salutation A — 2",   duration:68, cue:"Repeat the flow. Move with intention. Link breath to movement.",           image:yoga(17), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d6-y3", phase:"yoga",       name:"Crescent Lunge — Left",  duration:68, cue:"High lunge, arms high. Back heel lifted. Sink deep. Feel the heat.",       image:yoga(18), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d6-y4", phase:"yoga",       name:"Crescent Lunge — Right", duration:68, cue:"Switch. Right foot forward. Arms reach. Hips square. Power position.",    image:yoga(19), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d6-y5", phase:"yoga",       name:"Reverse Warrior — Left", duration:68, cue:"Flip right palm up, reach back. Left hand grazes back leg. Expansive.",   image:yoga(20), keyPoints:["left_wrist","right_wrist","left_knee","right_knee"] },
    { id:"d6-y6", phase:"yoga",       name:"Reverse Warrior — Right",duration:68, cue:"Switch to right side. Reach back. Open your heart. Breathe into it.",     image:yoga(1),  keyPoints:["left_wrist","right_wrist","left_knee","right_knee"] },
    { id:"d6-y7", phase:"yoga",       name:"Savasana Prep",          duration:68, cue:"Lie down. Let the energy settle. Arms and legs spread wide. Surrender.",   image:yoga(2),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d6-m1", phase:"meditation", name:"Energizing Breath",      duration:68, cue:"Short sharp exhales through nose — Kapalabhati. 20 pumps. Wake up.",       image:med(8),  keyPoints:[] },
    { id:"d6-m2", phase:"meditation", name:"Vitality Scan",          duration:68, cue:"Feel energy in your fingertips, your toes. Notice aliveness. That's you.", image:med(9),  keyPoints:[] },
    { id:"d6-m3", phase:"meditation", name:"Sun Visualization",      duration:68, cue:"Imagine sunlight entering your crown. Filling your body with gold.",       image:med(10), keyPoints:[] },
    { id:"d6-m4", phase:"meditation", name:"Purpose Clarity",        duration:68, cue:"Why did you wake up today? What matters to you? Let the answer rise.",     image:med(11), keyPoints:[] },
    { id:"d6-m5", phase:"meditation", name:"Energy Circulation",     duration:68, cue:"On inhale, draw energy up your spine. On exhale, radiate it outward.",     image:med(12), keyPoints:[] },
    { id:"d6-m6", phase:"meditation", name:"Momentum Affirmation",   duration:68, cue:"I have energy. I have clarity. I have everything I need to move forward.", image:med(13), keyPoints:[] },
    { id:"d6-m7", phase:"meditation", name:"Active Close",           duration:68, cue:"Take one deep breath. Exhale with sound. Open eyes. Carry this energy.",   image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 7 — REFLECTION
  ══════════════════════════════════════ */
  [
    { id:"d7-y1", phase:"yoga",       name:"Gentle Neck Rolls",      duration:68, cue:"Slow circles with your neck. Release weeks of held tension. Easy.",        image:yoga(3),  keyPoints:["left_shoulder","right_shoulder","nose"] },
    { id:"d7-y2", phase:"yoga",       name:"Shoulder Opener",        duration:68, cue:"Clasp hands behind back. Lift arms, open chest. Breathe into front body.", image:yoga(4),  keyPoints:["left_shoulder","right_shoulder","left_elbow","right_elbow"] },
    { id:"d7-y3", phase:"yoga",       name:"Side Body Stretch — Left",duration:68,cue:"Right arm overhead, lean left. Long line from hip to fingertip.",          image:yoga(5),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d7-y4", phase:"yoga",       name:"Side Body Stretch — Right",duration:68,cue:"Left arm overhead, lean right. Breathe into the space you're creating.",  image:yoga(6),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d7-y5", phase:"yoga",       name:"Seated Meditation Pose", duration:68, cue:"Cross-legged or on heels. Spine tall. Hands resting. Settle in.",          image:yoga(7),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d7-y6", phase:"yoga",       name:"Extended Puppy Pose",    duration:68, cue:"Hands forward, hips over knees. Chest melts toward mat. Heart opener.",    image:yoga(8),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d7-y7", phase:"yoga",       name:"Final Savasana",         duration:68, cue:"Lie completely still. Let your body absorb everything. Perfect stillness.", image:yoga(9),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d7-m1", phase:"meditation", name:"Week 1 Reflection",      duration:68, cue:"You completed 7 days. That is real. That is you. Let pride fill your chest.", image:med(1), keyPoints:[] },
    { id:"d7-m2", phase:"meditation", name:"What Changed",           duration:68, cue:"Notice what's different. Your body. Your mind. Your mornings. It's working.", image:med(2), keyPoints:[] },
    { id:"d7-m3", phase:"meditation", name:"Obstacle Gratitude",     duration:68, cue:"Think of a hard moment this week. What did it teach you? Honor it.",       image:med(3),  keyPoints:[] },
    { id:"d7-m4", phase:"meditation", name:"Rest Meditation",        duration:68, cue:"No doing. No achieving. Just being. This too is the practice.",             image:med(4),  keyPoints:[] },
    { id:"d7-m5", phase:"meditation", name:"Future Self Vision",     duration:68, cue:"See yourself 16 days from now. Stronger. Calmer. What do you see?",        image:med(5),  keyPoints:[] },
    { id:"d7-m6", phase:"meditation", name:"Recommitment",           duration:68, cue:"Week 2 starts tomorrow. Are you ready? Feel the yes rise in you.",         image:med(6),  keyPoints:[] },
    { id:"d7-m7", phase:"meditation", name:"Week 1 Seal",            duration:68, cue:"Palms together at heart. Bow your head. You earned this. Namaste.",        image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 8 — DEEPENING
  ══════════════════════════════════════ */
  [
    { id:"d8-y1", phase:"yoga",       name:"Half Moon — Left",       duration:68, cue:"Balance on left foot, right leg lifted. Right arm to sky. Expand.",        image:yoga(10), keyPoints:["left_ankle","right_ankle","left_wrist","right_wrist"] },
    { id:"d8-y2", phase:"yoga",       name:"Half Moon — Right",      duration:68, cue:"Switch. Balance on right. Find your focal point. Trust yourself.",         image:yoga(11), keyPoints:["left_ankle","right_ankle","left_wrist","right_wrist"] },
    { id:"d8-y3", phase:"yoga",       name:"Warrior III — Left",     duration:68, cue:"Hinge forward, left leg lifts. Body parallel to floor. Like an arrow.",    image:yoga(12), keyPoints:["left_hip","right_hip","left_ankle","right_ankle"] },
    { id:"d8-y4", phase:"yoga",       name:"Warrior III — Right",    duration:68, cue:"Switch. Right leg lifts. Arms reach forward or to sides. Be still.",       image:yoga(13), keyPoints:["left_hip","right_hip","left_ankle","right_ankle"] },
    { id:"d8-y5", phase:"yoga",       name:"Goddess Pose",           duration:68, cue:"Wide legs, toes out, deep squat. Arms in cactus. Strong and open.",        image:yoga(14), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d8-y6", phase:"yoga",       name:"Garland Pose (Malasana)",duration:68, cue:"Feet wide, heels down if possible. Deep squat. Elbows press knees open.",  image:yoga(15), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d8-y7", phase:"yoga",       name:"Wind Relieving Pose",    duration:68, cue:"On back, hug right knee, then left, then both. Release the lower back.",   image:yoga(16), keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d8-m1", phase:"meditation", name:"Depth Breath",           duration:68, cue:"Breathe deeper than yesterday. Let each breath go further into stillness.", image:med(8),  keyPoints:[] },
    { id:"d8-m2", phase:"meditation", name:"Observer Mind",          duration:68, cue:"Watch your thoughts like clouds passing. You are the sky. Not the clouds.", image:med(9),  keyPoints:[] },
    { id:"d8-m3", phase:"meditation", name:"Non-Judgment Practice",  duration:68, cue:"A thought arises. Label it 'thinking'. Return to breath. No criticism.",   image:med(10), keyPoints:[] },
    { id:"d8-m4", phase:"meditation", name:"Silence Between",        duration:68, cue:"Find the silence between thoughts. That space. Rest there.",                image:med(11), keyPoints:[] },
    { id:"d8-m5", phase:"meditation", name:"Awareness Awareness",    duration:68, cue:"Notice that you are aware. What is it that knows? Rest in that knowing.",  image:med(12), keyPoints:[] },
    { id:"d8-m6", phase:"meditation", name:"Deep Stillness",         duration:68, cue:"Nowhere to go. Nothing to do. Perfect as you are. Right now.",             image:med(13), keyPoints:[] },
    { id:"d8-m7", phase:"meditation", name:"Depth Seal",             duration:68, cue:"The practice deepens each day. You are changing. Trust the process.",      image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 9 — FIRE
  ══════════════════════════════════════ */
  [
    { id:"d9-y1", phase:"yoga",       name:"Sun Salutation B — 1",   duration:68, cue:"Chair, forward fold, plank, chaturanga, updog, downdog, warrior I.",       image:yoga(17), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d9-y2", phase:"yoga",       name:"Sun Salutation B — 2",   duration:68, cue:"Move through again. Breath moves you. You are the fire.",                  image:yoga(18), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d9-y3", phase:"yoga",       name:"Boat Pose",              duration:68, cue:"Sit, lift legs 45°, arms forward. V-shape. Core completely engaged.",       image:yoga(19), keyPoints:["left_hip","right_hip","left_knee","right_knee"] },
    { id:"d9-y4", phase:"yoga",       name:"Low Boat Hold",          duration:68, cue:"Lower legs and torso to hover. Two inches off floor. Shake is growth.",     image:yoga(20), keyPoints:["left_hip","right_hip","left_shoulder","right_shoulder"] },
    { id:"d9-y5", phase:"yoga",       name:"Firefly Prep",           duration:68, cue:"Squat, hands between feet. Feel your center. Press the floor away.",       image:yoga(1),  keyPoints:["left_wrist","right_wrist","left_hip","right_hip"] },
    { id:"d9-y6", phase:"yoga",       name:"Twisted Chair — Left",   duration:68, cue:"Chair pose, twist right elbow outside left knee. Wring it out.",           image:yoga(2),  keyPoints:["left_knee","right_knee","left_elbow","right_elbow"] },
    { id:"d9-y7", phase:"yoga",       name:"Twisted Chair — Right",  duration:68, cue:"Switch. Left elbow outside right knee. Hold the twist. Breathe.",          image:yoga(3),  keyPoints:["left_knee","right_knee","left_elbow","right_elbow"] },
    { id:"d9-m1", phase:"meditation", name:"Tapas — Inner Fire",     duration:68, cue:"Tapas means discipline. Feel your commitment as a flame in your belly.",   image:med(1),  keyPoints:[] },
    { id:"d9-m2", phase:"meditation", name:"Discomfort Welcome",     duration:68, cue:"Notice discomfort. Breathe into it. Growth lives at the edge of comfort.", image:med(2),  keyPoints:[] },
    { id:"d9-m3", phase:"meditation", name:"Burn the Old",           duration:68, cue:"Exhale — release who you were. Inhale — receive who you're becoming.",     image:med(3),  keyPoints:[] },
    { id:"d9-m4", phase:"meditation", name:"Motivation Source",      duration:68, cue:"Find your WHY. Hold it. When things are hard, this is what carries you.",  image:med(4),  keyPoints:[] },
    { id:"d9-m5", phase:"meditation", name:"Identity Shift",         duration:68, cue:"I am not someone who quits. I am someone who shows up. Every day.",        image:med(5),  keyPoints:[] },
    { id:"d9-m6", phase:"meditation", name:"Fire Breath Close",      duration:68, cue:"One powerful breath in. Explosive exhale through the mouth. Release.",     image:med(6),  keyPoints:[] },
    { id:"d9-m7", phase:"meditation", name:"Warrior Seal",           duration:68, cue:"You are more than your excuses. Day 9 is done. The fire is real.",         image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 10 — SURRENDER
  ══════════════════════════════════════ */
  [
    { id:"d10-y1", phase:"yoga",      name:"Yin — Butterfly Long",   duration:68, cue:"Soles together, fold completely forward. Hold still. 5 breaths minimum.",  image:yoga(4),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d10-y2", phase:"yoga",      name:"Yin — Dragon — Left",    duration:68, cue:"Low lunge, back knee down. Stay here. Let the hip slowly release.",        image:yoga(5),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d10-y3", phase:"yoga",      name:"Yin — Dragon — Right",   duration:68, cue:"Switch. Right foot forward. Surrender. Don't force. Let time do the work.", image:yoga(6),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d10-y4", phase:"yoga",      name:"Yin — Sleeping Swan — L",duration:68, cue:"Left shin forward in fold. Completely relax. Face toward the mat.",        image:yoga(7),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d10-y5", phase:"yoga",      name:"Yin — Sleeping Swan — R",duration:68, cue:"Switch sides. Let the right hip open at its own pace. No rush.",           image:yoga(8),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d10-y6", phase:"yoga",      name:"Yin — Sphinx Pose",      duration:68, cue:"On belly, forearms down. Let lower back open. Soft gaze forward.",         image:yoga(9),  keyPoints:["left_elbow","right_elbow","left_shoulder","right_shoulder"] },
    { id:"d10-y7", phase:"yoga",      name:"Yin — Savasana Full",    duration:68, cue:"Total stillness. Nothing to do. You surrendered. That took courage.",      image:yoga(10), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d10-m1", phase:"meditation","name":"Trust Meditation",     duration:68, cue:"Trust the process. Trust your body. Trust that you are being taken care of.", image:med(8), keyPoints:[] },
    { id:"d10-m2", phase:"meditation","name":"Non-Striving",         duration:68, cue:"You don't have to get anywhere right now. This moment is the destination.", image:med(9),  keyPoints:[] },
    { id:"d10-m3", phase:"meditation","name":"Let It Be",            duration:68, cue:"Whatever is happening — let it be. The resistance hurts more than the thing.", image:med(10), keyPoints:[] },
    { id:"d10-m4", phase:"meditation","name":"Forgiveness",          duration:68, cue:"Is there something you're holding against yourself? Offer it forgiveness.", image:med(11), keyPoints:[] },
    { id:"d10-m5", phase:"meditation","name":"Impermanence",         duration:68, cue:"This feeling, this moment, this problem — it will change. It always does.", image:med(12), keyPoints:[] },
    { id:"d10-m6", phase:"meditation","name":"Peace as Default",     duration:68, cue:"Peace is your natural state. All else is temporary. Return here anytime.", image:med(13), keyPoints:[] },
    { id:"d10-m7", phase:"meditation","name":"Surrender Seal",       duration:68, cue:"Exhale everything. Let go of the day. You did enough. You are enough.",    image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 11 — FOCUS
  ══════════════════════════════════════ */
  [
    { id:"d11-y1", phase:"yoga",      name:"Drishti Training",       duration:68, cue:"Pick a fixed point. Every pose today, keep your gaze locked. Train focus.", image:yoga(11), keyPoints:["nose","left_eye","right_eye"] },
    { id:"d11-y2", phase:"yoga",      name:"Standing Hand to Toe — L",duration:68,cue:"Hold left big toe, extend leg forward. Laser focus. Gaze doesn't move.",   image:yoga(12), keyPoints:["left_ankle","right_ankle","left_knee","right_knee"] },
    { id:"d11-y3", phase:"yoga",      name:"Standing Hand to Toe — R",duration:68,cue:"Switch. Right leg extends. If you wobble — refocus. That's the practice.",  image:yoga(13), keyPoints:["left_ankle","right_ankle","left_knee","right_knee"] },
    { id:"d11-y4", phase:"yoga",      name:"Warrior I Slow Hold",    duration:68, cue:"Warrior I. Now micro-adjust every part. Maximize perfect form. Breathe.",   image:yoga(14), keyPoints:["left_knee","right_knee","left_wrist","right_wrist"] },
    { id:"d11-y5", phase:"yoga",      name:"Headstand Prep",         duration:68, cue:"Forearms down, clasp hands. Practice dolphin pose. Build inversion base.",  image:yoga(15), keyPoints:["left_elbow","right_elbow","left_shoulder","right_shoulder"] },
    { id:"d11-y6", phase:"yoga",      name:"Crow Pose Prep",         duration:68, cue:"Hands flat, knees on upper arms. Lean forward until toes float. Or try.",   image:yoga(16), keyPoints:["left_wrist","right_wrist","left_elbow","right_elbow"] },
    { id:"d11-y7", phase:"yoga",      name:"Savasana Focus",         duration:68, cue:"Lie still. Keep focus on the breath alone. Not sleep — pure awareness.",    image:yoga(17), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d11-m1", phase:"meditation","name":"Single Point Meditation",duration:68,cue:"One object: your breath. When mind wanders, return. That IS the practice.", image:med(1),  keyPoints:[] },
    { id:"d11-m2", phase:"meditation","name":"Counting Breath",       duration:68, cue:"Count each exhale: 1 to 10. If you lose count, start again. No judgment.", image:med(2),  keyPoints:[] },
    { id:"d11-m3", phase:"meditation","name":"Note Distractions",     duration:68, cue:"A sound. Note 'hearing'. A thought. Note 'thinking'. Always return.",      image:med(3),  keyPoints:[] },
    { id:"d11-m4", phase:"meditation","name":"Expand to Body",        duration:68, cue:"Now include body sensations. Breath and body. Hold both at once.",          image:med(4),  keyPoints:[] },
    { id:"d11-m5", phase:"meditation","name":"Expand to Room",        duration:68, cue:"Expand awareness to the full room. Breath. Body. Space. Hold all of it.",   image:med(5),  keyPoints:[] },
    { id:"d11-m6", phase:"meditation","name":"Effortless Attention",  duration:68, cue:"Let attention rest naturally. No gripping. Soft focus. Wide open.",         image:med(6),  keyPoints:[] },
    { id:"d11-m7", phase:"meditation","name":"Clarity Seal",          duration:68, cue:"Your mind is clearer than it was 11 days ago. You built this. Well done.",  image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 12 — COMMUNITY
  ══════════════════════════════════════ */
  [
    { id:"d12-y1", phase:"yoga",      name:"Partner Intention",       duration:68, cue:"Think of someone doing their own struggle right now. Practice for them too.", image:yoga(18), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d12-y2", phase:"yoga",      name:"Mountain — Grounded",     duration:68, cue:"Feel the earth beneath you. Billions of beings on this same earth. Connect.", image:yoga(19), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d12-y3", phase:"yoga",      name:"Heart Opener Flow",       duration:68, cue:"Cobra, updog, wheel prep. Open chest. Receive. Give. Open.",                image:yoga(20), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d12-y4", phase:"yoga",      name:"Camel Pose",              duration:68, cue:"Kneel, hands to lower back, arc backward. Maximum heart opening.",          image:yoga(1),  keyPoints:["left_knee","right_knee","left_shoulder","right_shoulder"] },
    { id:"d12-y5", phase:"yoga",      name:"Fish Pose",               duration:68, cue:"On back, arch chest up, top of head down. Throat and heart exposed.",       image:yoga(2),  keyPoints:["left_elbow","right_elbow","left_shoulder","right_shoulder"] },
    { id:"d12-y6", phase:"yoga",      name:"Resting Heart Pose",      duration:68, cue:"Bolster or pillow under upper back. Arms wide. Heart points to the sky.",   image:yoga(3),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d12-y7", phase:"yoga",      name:"Savasana — Connected",    duration:68, cue:"Lie still. Feel that you are not alone. The world practices with you.",     image:yoga(4),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d12-m1", phase:"meditation","name":"Connection Meditation",  duration:68, cue:"Feel your connection to others. You are never as alone as you sometimes feel.", image:med(8), keyPoints:[] },
    { id:"d12-m2", phase:"meditation","name":"Send Strength",          duration:68, cue:"Think of someone struggling. Breathe in their pain. Breathe out your strength.", image:med(9), keyPoints:[] },
    { id:"d12-m3", phase:"meditation","name":"Receive Support",        duration:68, cue:"Now receive. Someone, somewhere, is thinking of you with warmth. Receive it.", image:med(10), keyPoints:[] },
    { id:"d12-m4", phase:"meditation","name":"Shared Humanity",        duration:68, cue:"Every person you pass has fears and dreams like yours. We are the same.",   image:med(11), keyPoints:[] },
    { id:"d12-m5", phase:"meditation","name":"Contribution Vision",    duration:68, cue:"How will you make someone's day better today? Plant that seed now.",        image:med(12), keyPoints:[] },
    { id:"d12-m6", phase:"meditation","name":"Gratitude for Others",   duration:68, cue:"Name five people who helped make you who you are. Thank them in silence.",  image:med(13), keyPoints:[] },
    { id:"d12-m7", phase:"meditation","name":"Ripple Seal",            duration:68, cue:"Your practice ripples outward. You becoming better makes the world better.", image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 13 — MASTERY
  ══════════════════════════════════════ */
  [
    { id:"d13-y1", phase:"yoga",      name:"Full Practice Flow — A",  duration:68, cue:"Sun A into Warriors into balances. You know this now. Own it.",            image:yoga(5),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d13-y2", phase:"yoga",      name:"Full Practice Flow — B",  duration:68, cue:"Continue. Feel how different this is from Day 1. You have changed.",       image:yoga(6),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d13-y3", phase:"yoga",      name:"Peak Pose Attempt",       duration:68, cue:"Try your hardest pose. Crow. Headstand. Wheel. Whatever calls you.",       image:yoga(7),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d13-y4", phase:"yoga",      name:"Peak Pose Again",         duration:68, cue:"Try once more. Progress is not always visible but it is happening.",       image:yoga(8),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d13-y5", phase:"yoga",      name:"Counter Pose",            duration:68, cue:"Child's pose. Recover. Let your nervous system reset. Honor effort.",      image:yoga(9),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d13-y6", phase:"yoga",      name:"Seated Integration",      duration:68, cue:"Sit tall. Feel the body you've built. 13 days of showing up. Real.",       image:yoga(10), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d13-y7", phase:"yoga",      name:"Long Savasana",           duration:68, cue:"Master's rest. Completely still. Absorb 13 days of transformation.",      image:yoga(11), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d13-m1", phase:"meditation","name":"Mastery Reflection",     duration:68, cue:"What have you mastered in 13 days? Name it. Don't be humble. It's real.", image:med(1),  keyPoints:[] },
    { id:"d13-m2", phase:"meditation","name":"Beginner's Mind",        duration:68, cue:"The master never stops being a beginner. Stay humble. Stay curious.",     image:med(2),  keyPoints:[] },
    { id:"d13-m3", phase:"meditation","name":"Skill Spiral",           duration:68, cue:"Every rep, every day, spirals upward. You won't always see it. Trust.",   image:med(3),  keyPoints:[] },
    { id:"d13-m4", phase:"meditation","name":"Teacher Within",         duration:68, cue:"You are becoming your own teacher. You know what you need. Listen.",      image:med(4),  keyPoints:[] },
    { id:"d13-m5", phase:"meditation","name":"Integrate Learning",     duration:68, cue:"Sit with everything the last 13 days have shown you. Let it land.",       image:med(5),  keyPoints:[] },
    { id:"d13-m6", phase:"meditation","name":"Beyond the App",         duration:68, cue:"The practice is not the 16 minutes. It's who you become. That goes everywhere.", image:med(6), keyPoints:[] },
    { id:"d13-m7", phase:"meditation","name":"Pre-Final Seal",         duration:68, cue:"One day left. Arrive tomorrow with everything you have. Make it yours.",  image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 14 — INTEGRATION
  ══════════════════════════════════════ */
  [
    { id:"d14-y1", phase:"yoga",      name:"Opening Gratitude Pose",  duration:68, cue:"Arms wide, palms up. Breathe in everything this program gave you.",       image:yoga(12), keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d14-y2", phase:"yoga",      name:"Your Favorite Pose",      duration:68, cue:"Do the pose you love most from this program. Own it completely.",          image:yoga(13), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d14-y3", phase:"yoga",      name:"Your Hardest Pose",       duration:68, cue:"Now the one that challenges you most. Meet it without fear. You're ready.", image:yoga(14), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d14-y4", phase:"yoga",      name:"Flow of Choice",          duration:68, cue:"Move freely for one minute. Your body knows. Let it express what it learned.", image:yoga(15), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d14-y5", phase:"yoga",      name:"Seated Forward Fold Deep",duration:68, cue:"Deepest forward fold yet. Two weeks of flexibility. Feel the difference.", image:yoga(16), keyPoints:["left_hip","right_hip","left_knee","right_knee"] },
    { id:"d14-y6", phase:"yoga",      name:"Legs Up the Wall",        duration:68, cue:"Legs up (or 45°). Inversions reverse fatigue. Let blood flow to your head.", image:yoga(17), keyPoints:["left_ankle","right_ankle","left_hip","right_hip"] },
    { id:"d14-y7", phase:"yoga",      name:"Final Yoga Savasana",     duration:68, cue:"The last yoga savasana of this cycle. Make it sacred. You've earned it.", image:yoga(18), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d14-m1", phase:"meditation","name":"Journey Replay",         duration:68, cue:"Day 1 to now. Walk through each day in your mind. How far you've come.",  image:med(8),  keyPoints:[] },
    { id:"d14-m2", phase:"meditation","name":"Core Value Clarity",     duration:68, cue:"What do you truly value? Let this practice have shown you. Trust it.",    image:med(9),  keyPoints:[] },
    { id:"d14-m3", phase:"meditation","name":"Who You Became",         duration:68, cue:"You are not who started Day 1. Name what's different. Honor the growth.", image:med(10), keyPoints:[] },
    { id:"d14-m4", phase:"meditation","name":"Next Chapter Vision",    duration:68, cue:"This ends. Something new begins. What chapter comes next? Visualize it.", image:med(11), keyPoints:[] },
    { id:"d14-m5", phase:"meditation","name":"Carry the Practice",     duration:68, cue:"How do you take this forward? Not an app — a way of being. Define it.",   image:med(12), keyPoints:[] },
    { id:"d14-m6", phase:"meditation","name":"Full Circle",            duration:68, cue:"Start with breath. End with breath. Between was a life. Now begin again.", image:med(13), keyPoints:[] },
    { id:"d14-m7", phase:"meditation","name":"Final Seal",             duration:68, cue:"Hands at heart. Deep bow. 14 days. You didn't quit. That changed you.",   image:med(14), keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 15 — TRANSCENDENCE
  ══════════════════════════════════════ */
  [
    { id:"d15-y1", phase:"yoga",      name:"Sunrise Salutation",      duration:68, cue:"Greet today like the first day. Full sun sal with maximum intention.",     image:yoga(19), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d15-y2", phase:"yoga",      name:"Advanced Balance Flow",   duration:68, cue:"Tree to Warrior III to Half Moon. The balance sequence. Flow.",            image:yoga(20), keyPoints:["left_ankle","right_ankle","left_hip","right_hip"] },
    { id:"d15-y3", phase:"yoga",      name:"Deep Backbend Sequence",  duration:68, cue:"Cobra to updog to full wheel if available. Spine is a lightning rod.",     image:yoga(1),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d15-y4", phase:"yoga",      name:"Core Fire Sequence",      duration:68, cue:"Boat. Low boat. Bicycle. Plank. The fire you built. Use it.",              image:yoga(2),  keyPoints:["left_hip","right_hip","left_shoulder","right_shoulder"] },
    { id:"d15-y5", phase:"yoga",      name:"Deep Hip Release",        duration:68, cue:"Pigeon both sides. 15 days of hips opening. Feel the freedom you built.",  image:yoga(3),  keyPoints:["left_knee","right_knee","left_hip","right_hip"] },
    { id:"d15-y6", phase:"yoga",      name:"Restorative Fold",        duration:68, cue:"Supported child's pose. Blanket on your back if available. Full release.", image:yoga(4),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d15-y7", phase:"yoga",      name:"Long Stillness",          duration:68, cue:"Savasana. Stillness deeper than you knew possible on Day 1. Rest.",        image:yoga(5),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d15-m1", phase:"meditation","name":"Beyond Thought",         duration:68, cue:"Rest in awareness itself. Not in thinking about awareness. Just be.",     image:med(1),  keyPoints:[] },
    { id:"d15-m2", phase:"meditation","name":"Pure Presence",          duration:68, cue:"No past. No future. The present moment is all there is. This is enough.", image:med(2),  keyPoints:[] },
    { id:"d15-m3", phase:"meditation","name":"Witness State",          duration:68, cue:"You are the witness. Everything passes through. You remain. Unchanging.", image:med(3),  keyPoints:[] },
    { id:"d15-m4", phase:"meditation","name":"Spaciousness",           duration:68, cue:"Feel the space in your chest. Your mind. Your life. You created this.",   image:med(4),  keyPoints:[] },
    { id:"d15-m5", phase:"meditation","name":"Timelessness",           duration:68, cue:"In deep stillness, time dissolves. This moment stretches forever.",       image:med(5),  keyPoints:[] },
    { id:"d15-m6", phase:"meditation","name":"Wholeness",              duration:68, cue:"You are complete. Nothing missing. Nothing to fix. Whole right now.",      image:med(6),  keyPoints:[] },
    { id:"d15-m7", phase:"meditation","name":"Tomorrow's Threshold",   duration:68, cue:"Tomorrow is Day 16. The finish. Arrive with your whole heart. Be ready.", image:med(7),  keyPoints:[] },
  ],

  /* ══════════════════════════════════════
     DAY 16 — COMPLETION ★
  ══════════════════════════════════════ */
  [
    { id:"d16-y1", phase:"yoga",      name:"Opening Circle",          duration:68, cue:"Stand in mountain. Arms open wide. You made it to Day 16. Take that in.",  image:yoga(6),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d16-y2", phase:"yoga",      name:"The Full Journey Flow",   duration:68, cue:"One complete sun salutation for every week you showed up. Move slowly.",   image:yoga(7),  keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d16-y3", phase:"yoga",      name:"Victory Warrior Sequence",duration:68, cue:"Warriors I, II, III all sides. You are a warrior. You proved it.",         image:yoga(8),  keyPoints:["left_knee","right_knee","left_wrist","right_wrist"] },
    { id:"d16-y4", phase:"yoga",      name:"Peak Pose — Final Attempt",duration:68,cue:"Your peak pose. Everything you've built — use it now. This is the moment.", image:yoga(9),  keyPoints:["left_wrist","right_wrist","left_shoulder","right_shoulder"] },
    { id:"d16-y5", phase:"yoga",      name:"Gratitude Bow",           duration:68, cue:"Kneel, bow forehead to the mat. 16 days of discipline. Bow to yourself.",  image:yoga(10), keyPoints:["left_shoulder","right_shoulder","nose"] },
    { id:"d16-y6", phase:"yoga",      name:"Heart Seat",              duration:68, cue:"Sit with hand on heart. Feel it beat. This heart showed up 16 times.",     image:yoga(11), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d16-y7", phase:"yoga",      name:"Final Resting Pose",      duration:68, cue:"The last savasana of Magic16. Make it sacred. You've transformed.",        image:yoga(12), keyPoints:["left_shoulder","right_shoulder","left_hip","right_hip"] },
    { id:"d16-m1", phase:"meditation","name":"Completion Breath",      duration:68, cue:"Three deep breaths for three things you're most proud of. Breathe them.", image:med(8),  keyPoints:[] },
    { id:"d16-m2", phase:"meditation","name":"The Before and After",   duration:68, cue:"Remember who you were before Day 1. Feel who you are now. That gap is growth.", image:med(9), keyPoints:[] },
    { id:"d16-m3", phase:"meditation","name":"Lessons Learned",        duration:68, cue:"What is the single most important thing this program taught you? Hold it.", image:med(10), keyPoints:[] },
    { id:"d16-m4", phase:"meditation","name":"Dedication",             duration:68, cue:"Dedicate this practice. To yourself. To someone you love. To the world.", image:med(11), keyPoints:[] },
    { id:"d16-m5", phase:"meditation","name":"The Habit Is Yours Now", duration:68, cue:"16 minutes is now yours. You don't need a program. You are the program.", image:med(12), keyPoints:[] },
    { id:"d16-m6", phase:"meditation","name":"What Comes Next",        duration:68, cue:"Day 17 is your choice. But the person who chooses it is different now.",   image:med(13), keyPoints:[] },
    { id:"d16-m7", phase:"meditation","name":"THE FINAL SEAL ★",       duration:68, cue:"Namaste. You saw this through. ManifiX is not an app. It became your practice.", image:med(14), keyPoints:[] },
  ],

];

/* ─────────────────────────────────────────
   EXPORTS
───────────────────────────────────────── */

/**
 * Get all 14 steps for a given day (1-indexed, 1–16)
 * Returns [] if day is out of range
 */
export function getSessionSteps(day) {
  const index = Number(day) - 1;
  if (index < 0 || index >= ALL_DAYS.length) return [];
  return ALL_DAYS[index];
}

/**
 * Get only yoga steps for a given day
 */
export function getYogaSteps(day) {
  return getSessionSteps(day).filter((s) => s.phase === "yoga");
}

/**
 * Get only meditation steps for a given day
 */
export function getMeditationSteps(day) {
  return getSessionSteps(day).filter((s) => s.phase === "meditation");
}

/**
 * Get total duration of a day's session in seconds
 */
export function getSessionDuration(day) {
  return getSessionSteps(day).reduce((sum, s) => sum + s.duration, 0);
}

/**
 * Get a single step by its id
 */
export function getStepById(id) {
  return ALL_DAYS.flat().find((s) => s.id === id) ?? null;
}

export default ALL_DAYS;
