// src/constants/steps.js
// ManifiX AI — Magic16 Complete Step Library
// 4 Modes × 16 Days × 14 Steps = 896 total steps
// Morning · Sleep · Focus · Posture
// Each session = 7 steps × 68s = 476s ≈ 8 min per phase
// Total per session = 16 minutes exactly

export const TOTAL_DAYS          = 16;
export const TOTAL_STEPS_PER_DAY = 14;
export const STEP_DURATION       = 68; // seconds
export const SESSION_DURATION    = 976; // 16 min 16 sec total

/* ─────────────────────────────────────────────
   IMAGE PATH HELPERS
───────────────────────────────────────────── */
const yoga    = (n) => `/assets/steps/yoga/yoga-${String(n).padStart(2,"0")}.jpg`;
const med     = (n) => `/assets/steps/med/med-${String(n).padStart(2,"0")}.jpg`;
const sleep   = (n) => `/assets/steps/sleep/sleep-${String(n).padStart(2,"0")}.jpg`;
const focus   = (n) => `/assets/steps/focus/focus-${String(n).padStart(2,"0")}.jpg`;
const posture = (n) => `/assets/steps/posture/posture-${String(n).padStart(2,"0")}.jpg`;

/* ─────────────────────────────────────────────
   STEP BUILDERS
───────────────────────────────────────────── */
const Y = (id,name,imgN,cue,kp=[]) => ({
  id, phase:"yoga", name, duration:STEP_DURATION,
  cue, image:yoga(imgN), type:"morning",
  keyPoints:kp,
});
const M = (id,name,imgN,cue) => ({
  id, phase:"meditation", name, duration:STEP_DURATION,
  cue, image:med(imgN), type:"morning", keyPoints:[],
});
const SY = (id,name,imgN,cue) => ({
  id, phase:"wind-down", name, duration:STEP_DURATION,
  cue, image:sleep(imgN), type:"sleep", keyPoints:[],
});
const SM = (id,name,imgN,cue) => ({
  id, phase:"sleep-prep", name, duration:STEP_DURATION,
  cue, image:sleep(imgN), type:"sleep", keyPoints:[],
});
const FY = (id,name,imgN,cue) => ({
  id, phase:"breathwork", name, duration:STEP_DURATION,
  cue, image:focus(imgN), type:"focus", keyPoints:[],
});
const FM = (id,name,imgN,cue) => ({
  id, phase:"clarity", name, duration:STEP_DURATION,
  cue, image:focus(imgN), type:"focus", keyPoints:[],
});
const PY = (id,name,imgN,cue) => ({
  id, phase:"stretch", name, duration:STEP_DURATION,
  cue, image:posture(imgN), type:"posture", keyPoints:[],
});
const PM = (id,name,imgN,cue) => ({
  id, phase:"alignment", name, duration:STEP_DURATION,
  cue, image:posture(imgN), type:"posture", keyPoints:[],
});

/* ═══════════════════════════════════════════════
   MODE 1 — MORNING  (Yoga + Meditation)
   All 16 days complete
═══════════════════════════════════════════════ */
const MORNING = [
  /* DAY 1 — AWAKENING */
  [
    Y("d1-y1","Mountain Pose",1,"Stand tall, feet together, arms at sides. Breathe in your power.",["left_shoulder","right_shoulder","left_hip","right_hip"]),
    Y("d1-y2","Raised Arms Pose",2,"Inhale, sweep arms overhead. Lift your chest, gaze forward.",["left_wrist","right_wrist"]),
    Y("d1-y3","Forward Fold",3,"Exhale, hinge at hips. Let your head hang heavy. Release tension.",["left_hip","right_hip","left_knee","right_knee"]),
    Y("d1-y4","Low Lunge Right",4,"Step right foot back. Sink your hips. Open your heart forward.",["right_knee","left_knee"]),
    Y("d1-y5","Downward Dog",5,"Press hips high. Heels reach toward the floor. Long spine.",["left_wrist","right_wrist","left_ankle","right_ankle"]),
    Y("d1-y6","Child's Pose",6,"Sink back onto your heels. Arms reach long. Total surrender.",["left_shoulder","right_shoulder"]),
    Y("d1-y7","Cat-Cow Flow",7,"Hands and knees. Inhale arch, exhale round. Move with breath.",["left_shoulder","right_shoulder"]),
    M("d1-m1","Breath Awareness",1,"Close your eyes. Feel your breath. In through nose, out through nose."),
    M("d1-m2","Body Scan Head",2,"Bring attention to scalp, forehead, jaw. Release every muscle."),
    M("d1-m3","Body Scan Chest",3,"Notice your heart beating. Feel your chest rise and fall. Stay."),
    M("d1-m4","Body Scan Belly",4,"Let belly soften. Breathe deep into the abdomen. No effort."),
    M("d1-m5","Body Scan Legs",5,"Feel weight in thighs, calves, feet. You are grounded."),
    M("d1-m6","Gratitude Anchor",6,"Think of one thing you are grateful for today. Hold it."),
    M("d1-m7","Return and Seal",7,"Wiggle your fingers. Take a deep breath. Open eyes when ready."),
  ],
  /* DAY 2 — FOUNDATION */
  [
    Y("d2-y1","Warrior I Left",8,"Left foot forward, right back at 45°. Raise arms overhead. Hold.",["left_knee","right_knee"]),
    Y("d2-y2","Warrior I Right",9,"Switch sides. Right foot forward. Square your hips. Breathe.",["left_knee","right_knee"]),
    Y("d2-y3","Warrior II Left",10,"Open arms to sides. Gaze over left fingertips. Strong legs.",["left_wrist","right_wrist"]),
    Y("d2-y4","Warrior II Right",11,"Switch to right. Sink front knee. Feel the burn. Stay present.",["left_wrist","right_wrist"]),
    Y("d2-y5","Triangle Left",12,"Straighten legs. Reach left hand down, right arm up. Long side body.",["left_ankle","right_ankle"]),
    Y("d2-y6","Triangle Right",13,"Now right side. Stack your hips. Open your chest to the sky.",["left_ankle","right_ankle"]),
    Y("d2-y7","Wide Legged Fold",14,"Feet wide. Fold from hips, crown toward floor. Let go.",["left_hip","right_hip"]),
    M("d2-m1","4-7-8 Breathing",8,"Inhale 4 counts. Hold 7. Exhale 8. This activates your calm."),
    M("d2-m2","4-7-8 Round 2",9,"Again. In for 4. Hold for 7. Out for 8. Nervous system settles."),
    M("d2-m3","4-7-8 Round 3",10,"One more round. Inhale 4. Hold 7. Exhale 8. You are doing great."),
    M("d2-m4","Mindful Seeing",11,"Open your eyes softly. Notice colors. Notice light. Just observe."),
    M("d2-m5","Mindful Hearing",12,"Close eyes again. What sounds exist right now? Near. Far. Between."),
    M("d2-m6","Present Moment",13,"You are here. This moment is real. Nothing else needs attention."),
    M("d2-m7","Closing Intention",14,"Set one intention for today. Say it silently. Make it yours."),
  ],
  /* DAY 3 — BALANCE */
  [
    Y("d3-y1","Tree Pose Left",15,"Balance on left foot. Right foot to inner thigh. Palms together.",["left_knee","right_knee"]),
    Y("d3-y2","Tree Pose Right",16,"Switch. Balance on right. Fix your gaze. Still mind finds stillness.",["left_knee","right_knee"]),
    Y("d3-y3","Eagle Arms",17,"Cross left arm under right, wrap forearms. Lift elbows. Squeeze.",["left_elbow","right_elbow"]),
    Y("d3-y4","Chair Pose",18,"Feet together, bend knees, sit back. Arms reach up. Thighs burn.",["left_knee","right_knee"]),
    Y("d3-y5","Standing Fold",19,"Fold deep. Grab opposite elbows. Sway gently side to side.",["left_hip","right_hip"]),
    Y("d3-y6","Halfway Lift",20,"Flat back. Hands to shins. Look forward. Long spine. Core engaged.",["left_shoulder","right_shoulder"]),
    Y("d3-y7","Mountain Hold",1,"Return to mountain. Feel your feet on the ground. You are solid.",["left_shoulder","right_shoulder"]),
    M("d3-m1","Loving-Kindness Self",1,"Repeat: May I be happy. May I be healthy. May I be at peace."),
    M("d3-m2","Loving-Kindness Loved",2,"Think of someone you love. Send: May you be happy. May you be well."),
    M("d3-m3","Loving-Kindness Neutral",3,"Someone neutral. Extend the same wish. May you be at peace."),
    M("d3-m4","Loving-Kindness All",4,"Expand to all beings everywhere. May all be happy. May all be free."),
    M("d3-m5","Heart Center Breath",5,"Hand on heart. Feel warmth. Breathe in love. Breathe out love."),
    M("d3-m6","Compassion Hold",6,"You deserve kindness. Everyone does. Hold that truth in your heart."),
    M("d3-m7","Seal with Warmth",7,"Rub palms together. Cup your eyes. Absorb the warmth. Open gently."),
  ],
  /* DAY 4 — STRENGTH */
  [
    Y("d4-y1","Plank Pose",2,"Hands under shoulders. Body straight. Hold. Breathe.",["left_wrist","right_wrist"]),
    Y("d4-y2","Side Plank Left",3,"Left hand down, stack feet. Right arm to sky. Hips stay high.",["left_wrist","left_shoulder"]),
    Y("d4-y3","Side Plank Right",4,"Switch. Right hand down. Body like a blade. Strong and still.",["right_wrist","right_shoulder"]),
    Y("d4-y4","Locust Pose",5,"Lie on belly. Lift chest, arms, legs. Back strength.",["left_shoulder","right_shoulder"]),
    Y("d4-y5","Bow Pose",6,"Grab ankles, kick back. Chest lifts. Heart opens. Breathe wide.",["left_ankle","right_ankle"]),
    Y("d4-y6","Bridge Pose",7,"On back, feet flat, hips up. Press through feet. Feel glutes fire.",["left_knee","right_knee"]),
    Y("d4-y7","Supine Twist",8,"Hug knees in. Drop both knees left, then right. Spine releases.",["left_knee","right_knee"]),
    M("d4-m1","Power Breath",8,"Three deep power breaths. Fill completely. Release fully. Feel alive."),
    M("d4-m2","Inner Strength Vision",9,"See yourself strong. Capable. Unshakeable. This is who you are."),
    M("d4-m3","Affirmation I Am",10,"Say silently: I am strong. I am disciplined. I am becoming more."),
    M("d4-m4","Core Awareness",11,"Feel your core center. Your foundation. Everything builds from here."),
    M("d4-m5","Courage Meditation",12,"Think of one thing avoided. Breathe courage into it."),
    M("d4-m6","Release Fear",13,"On each exhale, let fear dissolve. You are bigger than your fear."),
    M("d4-m7","Champion Seal",14,"Fists gently to chest. Feel your heartbeat. You showed up. Power."),
  ],
  /* DAY 5 — FLEXIBILITY */
  [
    Y("d5-y1","Seated Forward Fold",9,"Legs long, fold forward. Reach for feet. Let gravity do the work.",["left_hip","right_hip"]),
    Y("d5-y2","Butterfly Pose",10,"Soles of feet together. Let knees drop. Gently flutter like wings.",["left_knee","right_knee"]),
    Y("d5-y3","Pigeon Prep Left",11,"Left shin forward, right leg back. Fold over left leg. Deep hip release.",["left_knee","right_knee"]),
    Y("d5-y4","Pigeon Prep Right",12,"Switch sides. Right shin forward. Breathe into tightness. Stay.",["left_knee","right_knee"]),
    Y("d5-y5","Spinal Twist Left",13,"Left leg extended, right foot outside. Twist right.",["left_shoulder","right_shoulder"]),
    Y("d5-y6","Spinal Twist Right",14,"Switch. Twist to the left. Long spine. Look over left shoulder.",["left_shoulder","right_shoulder"]),
    Y("d5-y7","Happy Baby",15,"On back, grab outer feet. Rock gently. Childlike ease. Smile.",["left_knee","right_knee"]),
    M("d5-m1","Release Meditation",1,"What are you holding? Name it. Now release it like a balloon."),
    M("d5-m2","Softening Breath",2,"Each inhale receive. Each exhale let go. Nothing to hold."),
    M("d5-m3","Open Hand Practice",3,"Open palms face up. Feel what it means to be open, receptive."),
    M("d5-m4","Tension Map",4,"Scan for remaining tension. Send breath there. Watch it soften."),
    M("d5-m5","Flow Visualization",5,"Imagine water flowing through you. Clearing. Moving freely."),
    M("d5-m6","Acceptance",6,"Today is exactly as it should be. You are where you need to be."),
    M("d5-m7","Soft Close",7,"Long exhale. Settle deeper. Flexible in body and in mind."),
  ],
  /* DAY 6 — ENERGY */
  [
    Y("d6-y1","Sun Sal A Part 1",16,"Mountain. Reach up. Forward fold. Plank. Cobra. Downward dog.",["left_shoulder","right_shoulder"]),
    Y("d6-y2","Sun Sal A Part 2",17,"Repeat the flow. Move with intention. Link breath to movement.",["left_shoulder","right_shoulder"]),
    Y("d6-y3","Crescent Lunge Left",18,"High lunge, arms high. Back heel lifted. Sink deep. Feel heat.",["left_knee","right_knee"]),
    Y("d6-y4","Crescent Lunge Right",19,"Switch. Right foot forward. Arms reach. Hips square. Power.",["left_knee","right_knee"]),
    Y("d6-y5","Reverse Warrior Left",20,"Flip right palm up, reach back. Left hand grazes back leg.",["left_wrist","right_wrist"]),
    Y("d6-y6","Reverse Warrior Right",1,"Switch to right side. Reach back. Open your heart. Breathe.",["left_wrist","right_wrist"]),
    Y("d6-y7","Savasana Prep",2,"Lie down. Let energy settle. Arms and legs spread wide. Surrender.",["left_shoulder","right_shoulder"]),
    M("d6-m1","Energizing Breath",8,"Short sharp exhales through nose. 20 pumps. Kapalabhati. Wake up."),
    M("d6-m2","Vitality Scan",9,"Feel energy in fingertips, your toes. Notice aliveness. That is you."),
    M("d6-m3","Sun Visualization",10,"Imagine sunlight entering your crown. Filling your body with gold."),
    M("d6-m4","Purpose Clarity",11,"Why did you wake up today? What matters? Let the answer rise."),
    M("d6-m5","Energy Circulation",12,"On inhale, draw energy up spine. On exhale, radiate outward."),
    M("d6-m6","Momentum Affirmation",13,"I have energy. I have clarity. I have everything I need."),
    M("d6-m7","Active Close",14,"Deep breath. Exhale with sound. Open eyes. Carry this energy."),
  ],
  /* DAY 7 — REFLECTION */
  [
    Y("d7-y1","Gentle Neck Rolls",3,"Slow circles with neck. Release weeks of held tension. Easy.",["nose","left_eye","right_eye"]),
    Y("d7-y2","Shoulder Opener",4,"Clasp hands behind back. Lift arms, open chest. Breathe into front.",["left_shoulder","right_shoulder"]),
    Y("d7-y3","Side Body Left",5,"Right arm overhead, lean left. Long line from hip to fingertip.",["left_shoulder","right_shoulder"]),
    Y("d7-y4","Side Body Right",6,"Left arm overhead, lean right. Breathe into the space you create.",["left_shoulder","right_shoulder"]),
    Y("d7-y5","Seated Meditation",7,"Cross-legged or on heels. Spine tall. Hands resting. Settle in.",["left_shoulder","right_shoulder"]),
    Y("d7-y6","Extended Puppy",8,"Hands forward, hips over knees. Chest melts toward mat.",["left_wrist","right_wrist"]),
    Y("d7-y7","Final Savasana",9,"Lie completely still. Let your body absorb everything. Stillness.",["left_shoulder","right_shoulder"]),
    M("d7-m1","Week 1 Reflection",1,"You completed 7 days. That is real. That is you. Feel pride."),
    M("d7-m2","What Changed",2,"Notice what is different. Your body. Mind. Mornings. It is working."),
    M("d7-m3","Obstacle Gratitude",3,"Think of a hard moment this week. What did it teach? Honor it."),
    M("d7-m4","Rest Meditation",4,"No doing. No achieving. Just being. This too is the practice."),
    M("d7-m5","Future Self Vision",5,"See yourself 16 days from now. Stronger. Calmer. What do you see?"),
    M("d7-m6","Recommitment",6,"Week 2 starts tomorrow. Are you ready? Feel the yes rise in you."),
    M("d7-m7","Week 1 Seal",7,"Palms together at heart. Bow your head. You earned this. Namaste."),
  ],
  /* DAY 8 — DEEPENING */
  [
    Y("d8-y1","Half Moon Left",10,"Balance on left foot, right leg lifted. Right arm to sky. Expand.",["left_ankle","right_ankle"]),
    Y("d8-y2","Half Moon Right",11,"Switch. Balance on right. Find focal point. Trust yourself.",["left_ankle","right_ankle"]),
    Y("d8-y3","Warrior III Left",12,"Hinge forward, left leg lifts. Body parallel to floor. Arrow.",["left_hip","right_hip"]),
    Y("d8-y4","Warrior III Right",13,"Switch. Right leg lifts. Arms reach forward. Be still.",["left_hip","right_hip"]),
    Y("d8-y5","Goddess Pose",14,"Wide legs, toes out, deep squat. Arms in cactus. Strong and open.",["left_knee","right_knee"]),
    Y("d8-y6","Garland Pose",15,"Feet wide, heels down. Deep squat. Elbows press knees open.",["left_knee","right_knee"]),
    Y("d8-y7","Wind Relieving",16,"On back, hug right knee, then left, then both. Release lower back.",["left_knee","right_knee"]),
    M("d8-m1","Depth Breath",8,"Breathe deeper than yesterday. Each breath into deeper stillness."),
    M("d8-m2","Observer Mind",9,"Watch your thoughts like clouds passing. You are the sky. Not clouds."),
    M("d8-m3","Non-Judgment",10,"A thought arises. Label it thinking. Return to breath. No criticism."),
    M("d8-m4","Silence Between",11,"Find the silence between thoughts. That space. Rest there."),
    M("d8-m5","Awareness Awareness",12,"Notice that you are aware. What is it that knows? Rest in knowing."),
    M("d8-m6","Deep Stillness",13,"Nowhere to go. Nothing to do. Perfect as you are. Right now."),
    M("d8-m7","Depth Seal",14,"The practice deepens each day. You are changing. Trust the process."),
  ],
  /* DAY 9 — FIRE */
  [
    Y("d9-y1","Sun Sal B Part 1",17,"Chair, forward fold, plank, chaturanga, updog, downdog, warrior.",["left_shoulder","right_shoulder"]),
    Y("d9-y2","Sun Sal B Part 2",18,"Move through again. Breath moves you. You are the fire.",["left_shoulder","right_shoulder"]),
    Y("d9-y3","Boat Pose",19,"Sit, lift legs 45°, arms forward. V-shape. Core completely engaged.",["left_hip","right_hip"]),
    Y("d9-y4","Low Boat Hold",20,"Lower legs and torso to hover. Two inches off floor. Shake is growth.",["left_hip","right_hip"]),
    Y("d9-y5","Firefly Prep",1,"Squat, hands between feet. Feel center. Press floor away.",["left_wrist","right_wrist"]),
    Y("d9-y6","Twisted Chair Left",2,"Chair pose, twist right elbow outside left knee. Wring it out.",["left_knee","right_knee"]),
    Y("d9-y7","Twisted Chair Right",3,"Switch. Left elbow outside right knee. Hold twist. Breathe.",["left_knee","right_knee"]),
    M("d9-m1","Tapas Inner Fire",1,"Tapas means discipline. Feel your commitment as a flame in belly."),
    M("d9-m2","Discomfort Welcome",2,"Notice discomfort. Breathe into it. Growth lives at the edge."),
    M("d9-m3","Burn the Old",3,"Exhale release who you were. Inhale receive who you are becoming."),
    M("d9-m4","Motivation Source",4,"Find your WHY. Hold it. When things are hard this carries you."),
    M("d9-m5","Identity Shift",5,"I am not someone who quits. I am someone who shows up every day."),
    M("d9-m6","Fire Breath Close",6,"One powerful breath in. Explosive exhale through mouth. Release."),
    M("d9-m7","Warrior Seal",7,"You are more than your excuses. Day 9 is done. The fire is real."),
  ],
  /* DAY 10 — SURRENDER */
  [
    Y("d10-y1","Yin Butterfly Long",4,"Soles together, fold completely forward. Hold still. 5 breaths.",["left_knee","right_knee"]),
    Y("d10-y2","Yin Dragon Left",5,"Low lunge, back knee down. Stay here. Let hip slowly release.",["left_knee","right_knee"]),
    Y("d10-y3","Yin Dragon Right",6,"Switch. Right foot forward. Surrender. Let time do the work.",["left_knee","right_knee"]),
    Y("d10-y4","Sleeping Swan Left",7,"Left shin forward in fold. Completely relax. Face toward mat.",["left_knee","right_knee"]),
    Y("d10-y5","Sleeping Swan Right",8,"Switch sides. Let right hip open at its own pace. No rush.",["left_knee","right_knee"]),
    Y("d10-y6","Sphinx Pose",9,"On belly, forearms down. Let lower back open. Soft gaze forward.",["left_elbow","right_elbow"]),
    Y("d10-y7","Yin Savasana",10,"Total stillness. Nothing to do. You surrendered. That took courage.",["left_shoulder","right_shoulder"]),
    M("d10-m1","Trust Meditation",8,"Trust the process. Trust your body. Trust you are being cared for."),
    M("d10-m2","Non-Striving",9,"You do not have to get anywhere right now. This moment is the destination."),
    M("d10-m3","Let It Be",10,"Whatever is happening let it be. Resistance hurts more than the thing."),
    M("d10-m4","Forgiveness",11,"Is there something held against yourself? Offer it forgiveness."),
    M("d10-m5","Impermanence",12,"This feeling, this moment, this problem will change. It always does."),
    M("d10-m6","Peace as Default",13,"Peace is your natural state. All else is temporary. Return here."),
    M("d10-m7","Surrender Seal",14,"Exhale everything. Let go of the day. You did enough. You are enough."),
  ],
  /* DAY 11 — FOCUS */
  [
    Y("d11-y1","Drishti Training",11,"Pick a fixed point. Every pose today, keep gaze locked. Train focus.",["nose","left_eye","right_eye"]),
    Y("d11-y2","Standing Hand Toe Left",12,"Hold left big toe, extend leg forward. Laser focus. Gaze steady.",["left_ankle","right_ankle"]),
    Y("d11-y3","Standing Hand Toe Right",13,"Switch. Right leg extends. If you wobble refocus. That is the practice.",["left_ankle","right_ankle"]),
    Y("d11-y4","Warrior I Slow Hold",14,"Warrior I. Now micro-adjust every part. Maximize perfect form.",["left_knee","right_knee"]),
    Y("d11-y5","Headstand Prep",15,"Forearms down, clasp hands. Practice dolphin pose. Build base.",["left_elbow","right_elbow"]),
    Y("d11-y6","Crow Pose Prep",16,"Hands flat, knees on upper arms. Lean forward until toes float.",["left_wrist","right_wrist"]),
    Y("d11-y7","Savasana Focus",17,"Lie still. Keep focus on breath alone. Not sleep. Pure awareness.",["left_shoulder","right_shoulder"]),
    M("d11-m1","Single Point",1,"One object: your breath. When mind wanders, return. That IS the practice."),
    M("d11-m2","Counting Breath",2,"Count each exhale 1 to 10. If you lose count, start again. No judgment."),
    M("d11-m3","Note Distractions",3,"A sound. Note hearing. A thought. Note thinking. Always return."),
    M("d11-m4","Expand to Body",4,"Now include body sensations. Breath and body. Hold both at once."),
    M("d11-m5","Expand to Room",5,"Expand awareness to full room. Breath. Body. Space. Hold all of it."),
    M("d11-m6","Effortless Attention",6,"Let attention rest naturally. No gripping. Soft focus. Wide open."),
    M("d11-m7","Clarity Seal",7,"Your mind is clearer than 11 days ago. You built this. Well done."),
  ],
  /* DAY 12 — COMMUNITY */
  [
    Y("d12-y1","Partner Intention",18,"Think of someone in their own struggle. Practice for them too.",["left_shoulder","right_shoulder"]),
    Y("d12-y2","Mountain Grounded",19,"Feel the earth beneath. Billions of beings on this same earth. Connect.",["left_shoulder","right_shoulder"]),
    Y("d12-y3","Heart Opener Flow",20,"Cobra, updog, wheel prep. Open chest. Receive. Give. Open.",["left_shoulder","right_shoulder"]),
    Y("d12-y4","Camel Pose",1,"Kneel, hands to lower back, arc backward. Maximum heart opening.",["left_knee","right_knee"]),
    Y("d12-y5","Fish Pose",2,"On back, arch chest up, top of head down. Throat and heart exposed.",["left_elbow","right_elbow"]),
    Y("d12-y6","Resting Heart",3,"Heart opens to sky. Arms wide. Receive.",["left_shoulder","right_shoulder"]),
    Y("d12-y7","Savasana Connected",4,"Lie still. Feel you are not alone. The world practices with you.",["left_shoulder","right_shoulder"]),
    M("d12-m1","Connection Meditation",8,"Feel connection to others. You are never as alone as you sometimes feel."),
    M("d12-m2","Send Strength",9,"Think of someone struggling. Breathe in their pain. Breathe out strength."),
    M("d12-m3","Receive Support",10,"Now receive. Someone somewhere is thinking of you with warmth. Receive."),
    M("d12-m4","Shared Humanity",11,"Every person you pass has fears and dreams like yours. We are the same."),
    M("d12-m5","Contribution Vision",12,"How will you make someone's day better today? Plant that seed now."),
    M("d12-m6","Gratitude for Others",13,"Name five people who helped make you who you are. Thank them silently."),
    M("d12-m7","Ripple Seal",14,"Your practice ripples outward. You becoming better makes world better."),
  ],
  /* DAY 13 — MASTERY */
  [
    Y("d13-y1","Full Practice A",5,"Sun A into Warriors into balances. You know this now. Own it.",["left_shoulder","right_shoulder"]),
    Y("d13-y2","Full Practice B",6,"Continue. Feel how different from Day 1. You have changed.",["left_shoulder","right_shoulder"]),
    Y("d13-y3","Peak Pose Attempt",7,"Try your hardest pose. Crow. Headstand. Wheel. Whatever calls you.",["left_wrist","right_wrist"]),
    Y("d13-y4","Peak Pose Again",8,"Try once more. Progress is not always visible but it is happening.",["left_wrist","right_wrist"]),
    Y("d13-y5","Counter Pose",9,"Child's pose. Recover. Let nervous system reset. Honor effort.",["left_shoulder","right_shoulder"]),
    Y("d13-y6","Seated Integration",10,"Sit tall. Feel the body you have built. 13 days of showing up. Real.",["left_shoulder","right_shoulder"]),
    Y("d13-y7","Long Savasana",11,"Master's rest. Completely still. Absorb 13 days of transformation.",["left_shoulder","right_shoulder"]),
    M("d13-m1","Mastery Reflection",1,"What have you mastered in 13 days? Name it. Do not be humble. It is real."),
    M("d13-m2","Beginner's Mind",2,"The master never stops being a beginner. Stay humble. Stay curious."),
    M("d13-m3","Skill Spiral",3,"Every rep, every day, spirals upward. You will not always see it. Trust."),
    M("d13-m4","Teacher Within",4,"You are becoming your own teacher. You know what you need. Listen."),
    M("d13-m5","Integrate Learning",5,"Sit with everything the last 13 days have shown you. Let it land."),
    M("d13-m6","Beyond the App",6,"The practice is not the 16 minutes. It is who you become. Goes everywhere."),
    M("d13-m7","Pre-Final Seal",7,"One day left. Arrive tomorrow with everything you have. Make it yours."),
  ],
  /* DAY 14 — INTEGRATION */
  [
    Y("d14-y1","Opening Gratitude",12,"Arms wide, palms up. Breathe in everything this program gave you.",["left_wrist","right_wrist"]),
    Y("d14-y2","Your Favorite Pose",13,"Do the pose you love most from this program. Own it completely.",["left_shoulder","right_shoulder"]),
    Y("d14-y3","Your Hardest Pose",14,"The one that challenges you most. Meet it without fear. Ready.",["left_shoulder","right_shoulder"]),
    Y("d14-y4","Flow of Choice",15,"Move freely for one minute. Your body knows. Let it express.",["left_shoulder","right_shoulder"]),
    Y("d14-y5","Deep Forward Fold",16,"Deepest fold yet. Two weeks of flexibility. Feel the difference.",["left_hip","right_hip"]),
    Y("d14-y6","Legs Up the Wall",17,"Legs up or 45°. Let blood flow to your head.",["left_ankle","right_ankle"]),
    Y("d14-y7","Final Yoga Savasana",18,"Last yoga savasana of this cycle. Make it sacred. You earned it.",["left_shoulder","right_shoulder"]),
    M("d14-m1","Journey Replay",8,"Day 1 to now. Walk through each day in mind. How far you have come."),
    M("d14-m2","Core Value Clarity",9,"What do you truly value? Let this practice have shown you. Trust it."),
    M("d14-m3","Who You Became",10,"You are not who started Day 1. Name what is different. Honor growth."),
    M("d14-m4","Next Chapter Vision",11,"This ends. Something new begins. What chapter comes next? Visualize."),
    M("d14-m5","Carry the Practice",12,"How do you take this forward? Not an app. A way of being. Define it."),
    M("d14-m6","Full Circle",13,"Start with breath. End with breath. Between was a life. Begin again."),
    M("d14-m7","Final Seal",14,"Hands at heart. Deep bow. 14 days. You did not quit. That changed you."),
  ],
  /* DAY 15 — TRANSCENDENCE */
  [
    Y("d15-y1","Sunrise Salutation",19,"Greet today like the first day. Full sun sal with maximum intention.",["left_shoulder","right_shoulder"]),
    Y("d15-y2","Advanced Balance Flow",20,"Tree to Warrior III to Half Moon. The balance sequence. Flow.",["left_ankle","right_ankle"]),
    Y("d15-y3","Deep Backbend",1,"Cobra to updog to full wheel if available. Spine is a lightning rod.",["left_shoulder","right_shoulder"]),
    Y("d15-y4","Core Fire Sequence",2,"Boat. Low boat. Bicycle. Plank. The fire you built. Use it.",["left_hip","right_hip"]),
    Y("d15-y5","Deep Hip Release",3,"Pigeon both sides. 15 days of hips opening. Feel the freedom.",["left_knee","right_knee"]),
    Y("d15-y6","Restorative Fold",4,"Supported child's pose. Full release.",["left_shoulder","right_shoulder"]),
    Y("d15-y7","Long Stillness",5,"Savasana. Stillness deeper than possible on Day 1. Rest.",["left_shoulder","right_shoulder"]),
    M("d15-m1","Beyond Thought",1,"Rest in awareness itself. Not thinking about awareness. Just be."),
    M("d15-m2","Pure Presence",2,"No past. No future. Present moment is all there is. This is enough."),
    M("d15-m3","Witness State",3,"You are the witness. Everything passes through. You remain. Unchanging."),
    M("d15-m4","Spaciousness",4,"Feel the space in chest. Your mind. Your life. You created this."),
    M("d15-m5","Timelessness",5,"In deep stillness, time dissolves. This moment stretches forever."),
    M("d15-m6","Wholeness",6,"You are complete. Nothing missing. Nothing to fix. Whole right now."),
    M("d15-m7","Tomorrow's Threshold",7,"Tomorrow is Day 16. The finish. Arrive with your whole heart. Ready."),
  ],
  /* DAY 16 — COMPLETION ★ */
  [
    Y("d16-y1","Opening Circle",6,"Stand in mountain. Arms open wide. You made it to Day 16. Take that in.",["left_wrist","right_wrist"]),
    Y("d16-y2","Full Journey Flow",7,"One complete sun salutation for every week you showed up. Move slowly.",["left_shoulder","right_shoulder"]),
    Y("d16-y3","Victory Warrior",8,"Warriors I, II, III all sides. You are a warrior. You proved it.",["left_knee","right_knee"]),
    Y("d16-y4","Peak Pose Final",9,"Your peak pose. Everything you have built. Use it now. This is the moment.",["left_wrist","right_wrist"]),
    Y("d16-y5","Gratitude Bow",10,"Kneel, bow forehead to mat. 16 days of discipline. Bow to yourself.",["left_shoulder","right_shoulder"]),
    Y("d16-y6","Heart Seat",11,"Sit with hand on heart. Feel it beat. This heart showed up 16 times.",["left_shoulder","right_shoulder"]),
    Y("d16-y7","Final Resting Pose",12,"The last savasana of Magic16. Make it sacred. You have transformed.",["left_shoulder","right_shoulder"]),
    M("d16-m1","Completion Breath",8,"Three deep breaths for three things most proud of. Breathe them."),
    M("d16-m2","Before and After",9,"Remember who you were before Day 1. Feel who you are now. That gap is growth."),
    M("d16-m3","Lessons Learned",10,"The single most important thing this program taught you. Hold it."),
    M("d16-m4","Dedication",11,"Dedicate this practice. To yourself. To someone you love. To the world."),
    M("d16-m5","Habit Is Yours",12,"16 minutes is now yours. You do not need a program. You are the program."),
    M("d16-m6","What Comes Next",13,"Day 17 is your choice. But the person who chooses is different now."),
    M("d16-m7","THE FINAL SEAL ★",14,"Namaste. You saw this through. ManifiX is not an app. It became your practice."),
  ],
];

/* ═══════════════════════════════════════════════
   MODE 2 — SLEEP  (Wind-down + Sleep prep)
   7 unique days, days 8-16 cycle with variation
═══════════════════════════════════════════════ */
const SLEEP_BASE = [
  /* SLEEP DAY 1 — RELEASE */
  [
    SY("s1-y1","Gentle Neck Release",1,"Slowly lower right ear to right shoulder. Feel the left side open. Breathe."),
    SY("s1-y2","Shoulder Melts",2,"Roll shoulders back slowly. Let them melt away from your ears. Release."),
    SY("s1-y3","Seated Forward Fold",3,"Sit, extend legs, fold gently forward. No straining. Just release."),
    SY("s1-y4","Supine Knee Hug",4,"Lie on back. Hug both knees to chest. Rock gently side to side."),
    SY("s1-y5","Supine Twist Left",5,"Knees fall to left. Right arm extends. Breathe into your right side."),
    SY("s1-y6","Supine Twist Right",6,"Switch. Knees fall right. Breathe into your left side. Let go."),
    SY("s1-y7","Legs Up Relaxation",7,"Extend legs up or rest against wall. Close your eyes. Soften completely."),
    SM("s1-m1","4-7-8 Sleep Breath",8,"Inhale 4. Hold 7. Exhale 8. This switches on your parasympathetic system."),
    SM("s1-m2","Body Weight Release",9,"Feel how heavy your body is. Let the floor hold you completely. Sink."),
    SM("s1-m3","Release the Day",10,"Imagine today's worries as clouds. Watch them drift away. One by one."),
    SM("s1-m4","Progressive Relax",11,"Tense feet for 3 seconds. Release. Move to calves. Release. Keep going."),
    SM("s1-m5","Safe Place Vision",12,"Picture a place where you feel completely safe and calm. Go there."),
    SM("s1-m6","Gratitude Wind Down",13,"Name 3 small good things from today. Feel them. Let them be enough."),
    SM("s1-m7","Sleep Surrender",14,"You have done enough today. Close your eyes. Let sleep find you. Rest."),
  ],
  /* SLEEP DAY 2 — SOFTEN */
  [
    SY("s2-y1","Butterfly Yin",1,"Soles together, let knees fall wide. Fold gently forward. Soft eyes."),
    SY("s2-y2","Child's Pose Extended",2,"Arms reach forward, forehead to mat. Breathe into your back body."),
    SY("s2-y3","Supported Bridge",3,"Lie on back, lift hips gently. Feel chest open. Hold without effort."),
    SY("s2-y4","Reclined Bound Angle",4,"On back, soles of feet together. Arms rest at sides. Completely open."),
    SY("s2-y5","Melting Heart",5,"On hands and knees. Walk hands forward. Drop chest. Hips stay up."),
    SY("s2-y6","Sleeping Swan Left",6,"Left shin forward. Fold over it. Let hip release at its own pace."),
    SY("s2-y7","Sleeping Swan Right",7,"Switch. Right shin forward. Complete surrender. Nothing to do."),
    SM("s2-m1","Slow Breath Count",8,"Inhale and count to 5. Exhale and count to 5. Just the numbers. Just the breath."),
    SM("s2-m2","Soften Each Muscle",9,"Starting at face. Soften your eyes. Soften your jaw. Work downward."),
    SM("s2-m3","Tomorrow Can Wait",10,"Anything not done today can wait. Right now there is only this breath."),
    SM("s2-m4","The Body Knows Sleep",11,"Your body has slept thousands of times. It knows exactly what to do."),
    SM("s2-m5","Warmth Visualization",12,"Imagine warm golden light spreading from your chest to every limb."),
    SM("s2-m6","Counting Backwards",13,"Count from 50 backwards. Slow. If you lose count, start again. Slowly."),
    SM("s2-m7","Sleep Now",14,"There is nowhere to be. Nothing to solve. Just rest. Just breathe. Sleep."),
  ],
  /* SLEEP DAY 3 — STILLNESS */
  [
    SY("s3-y1","Standing Side Stretch",1,"Arms overhead, lean right then left. Yawn if you need to. Let body open."),
    SY("s3-y2","Forward Fold Ragdoll",2,"Hinge at hips, let upper body hang completely. Shake head yes and no."),
    SY("s3-y3","Wide Knee Child's Pose",3,"Knees wide, big toes touch, sit back. Arms forward. Full surrender."),
    SY("s3-y4","Reclined Spinal Twist",4,"On back, both knees fall to one side. Opposite arm extends. Breathe."),
    SY("s3-y5","Legs Up the Wall",5,"Get feet up. Eyes close. Let tension drain from legs. 2 full minutes."),
    SY("s3-y6","Corpse Pose Setup",6,"Position yourself for savasana. Arms slightly away from body. Palms up."),
    SY("s3-y7","Full Savasana Entry",7,"Completely motionless. Every muscle group one final release. Still now."),
    SM("s3-m1","Cooling Breath",8,"Breathe in through nose. Out through open mouth slowly. Cooling down."),
    SM("s3-m2","Thought Parking",9,"A thought arrives. Say: I will deal with you tomorrow. Then let it pass."),
    SM("s3-m3","Heartbeat Focus",10,"Place hand on chest. Feel your heartbeat. Slow. Steady. Trustworthy."),
    SM("s3-m4","One Thing Release",11,"Name one thing you are releasing from today. Say it. Let it go fully."),
    SM("s3-m5","Ocean Breath",12,"Each exhale is a wave going out. Each inhale brings calm water back in."),
    SM("s3-m6","Sleep Affirmation",13,"I am safe. I am calm. I am ready for deep, healing, restorative sleep."),
    SM("s3-m7","Drift",14,"Nothing left to do. Nowhere to go. Let your mind wander and drift to sleep."),
  ],
  /* SLEEP DAY 4 — RESTORE */
  [
    SY("s4-y1","Gentle Hip Circles",1,"Sitting, make slow circles with your hips. Loosen the pelvis. Breathe."),
    SY("s4-y2","Pigeon Pose Left",2,"Left shin forward. Use support if needed. Completely passive. Breathe."),
    SY("s4-y3","Pigeon Pose Right",3,"Switch. Right shin forward. This may take time. Let it. Breathe."),
    SY("s4-y4","Knees to Chest Rock",4,"On back, hug knees tightly. Rock gently. Massage your lower back."),
    SY("s4-y5","Happy Baby",5,"Grab outer feet. Knees wide. Rock side to side. This is rest posture."),
    SY("s4-y6","Constructive Rest",6,"On back, knees bent, feet flat. Arms rest. Lower back releases."),
    SY("s4-y7","Savasana Blanket",7,"Cover yourself if cold. Maximum comfort. Darkness preferred. Rest."),
    SM("s4-m1","Body Inventory",8,"How does each part of your body feel right now? No judgment. Just notice."),
    SM("s4-m2","Exhale Longer",9,"Make each exhale twice as long as inhale. This activates deep rest."),
    SM("s4-m3","Five Senses Wind Down",10,"Name 5 things you can sense. 4 feelings. 3 sounds. 2 smells. 1 taste."),
    SM("s4-m4","Tomorrow's Gift",11,"Sleep is a gift you are giving tomorrow's version of yourself. Accept it."),
    SM("s4-m5","Memory Softening",12,"One memory from today that made you smile. Hold it softly. Let it go."),
    SM("s4-m6","Whole Body Breathing",13,"Imagine your whole body breathing. Expanding on inhale. Releasing on exhale."),
    SM("s4-m7","Permission to Rest",14,"You have full permission to completely rest. You earned this. Sleep now."),
  ],
  /* SLEEP DAY 5 — PEACE */
  [
    SY("s5-y1","Slow Sun Breath",1,"Arms rise slowly on inhale. Lower slowly on exhale. No rush. Gentle."),
    SY("s5-y2","Low Lunge Release",2,"Step into lunge. Lower back knee. Sink slowly. Release hip flexors."),
    SY("s5-y3","Seated Twist Release",3,"Seated, twist gently. No force. Just wringing out the day."),
    SY("s5-y4","Reclined Figure Four",4,"On back, cross left ankle over right knee. Draw legs toward chest."),
    SY("s5-y5","Reclined Figure Four Right",5,"Switch. Right ankle over left knee. Same gentle release. Breathe."),
    SY("s5-y6","Spine Long Stretch",6,"Extend arms overhead and legs long. Full body stretch. One final yawn."),
    SY("s5-y7","Night Savasana",7,"Final position for the night. Adjust once. Then commit to stillness."),
    SM("s5-m1","Peace Word",8,"Choose one word that means peace to you. Breathe it in. Breathe it out."),
    SM("s5-m2","Tension Check",9,"Any remaining tension? Breathe into it directly. It does not need fixing."),
    SM("s5-m3","The Night is Safe",10,"You are safe where you are. The night holds you. Nothing to monitor."),
    SM("s5-m4","Muscle by Muscle",11,"Consciously relax each muscle group. Face. Neck. Shoulders. Chest. Down."),
    SM("s5-m5","Dream Invitation",12,"Set an intention for your dreams. What would you like to explore tonight?"),
    SM("s5-m6","Day Completion",13,"Your day is complete. Every incomplete thing can rest until tomorrow."),
    SM("s5-m7","Into Sleep",14,"Each breath slower. Each exhale longer. Consciousness beginning to soften. Sleep."),
  ],
  /* SLEEP DAY 6 — DEEP REST */
  [
    SY("s6-y1","Yawn and Stretch",1,"Give yourself permission to yawn. Stretch your jaw wide. Neck long."),
    SY("s6-y2","Cat Cow Slow",2,"On hands and knees, move through cat and cow at half normal speed."),
    SY("s6-y3","Thread the Needle",3,"From hands and knees, slide right arm under body. Shoulder to floor."),
    SY("s6-y4","Thread Needle Other",4,"Come back to center. Slide left arm under. Cheek to floor. Release."),
    SY("s6-y5","Supported Child's Pose",5,"Pillow under chest if available. Forehead down. Arms wherever comfortable."),
    SY("s6-y6","Side Lying Rest",6,"Lie on left side. Knees slightly bent. This is the sleep position. Breathe."),
    SY("s6-y7","Final Relaxation",7,"Whatever position you will sleep in. Get there now. Settle completely."),
    SM("s6-m1","Release Noise",8,"Imagine all the noise of today leaving your body with each exhale."),
    SM("s6-m2","Quiet Mind",9,"Notice how much quieter your mind is now versus when you started. That is you."),
    SM("s6-m3","Body Temperature",10,"Notice the warmth of your body. The weight. The rise and fall. Just notice."),
    SM("s6-m4","Night Protection",11,"All that needed to happen today happened. You are done. Rest now."),
    SM("s6-m5","Dissolving Boundaries",12,"Where does your body end and the bed begin? Let the edges soften."),
    SM("s6-m6","Sleep Anchor",13,"Your bed is your anchor. It holds you. You do not need to hold yourself."),
    SM("s6-m7","Last Conscious Breath",14,"Take one final conscious breath. Let the next one be toward sleep. Goodnight."),
  ],
  /* SLEEP DAY 7 — SEVEN NIGHTS */
  [
    SY("s7-y1","Walking Breath",1,"Pace slowly for 30 seconds. Breathe in for 4 steps. Out for 4 steps."),
    SY("s7-y2","Wall Forward Fold",2,"Stand near wall. Fold forward. Let arms hang. Scalp releases."),
    SY("s7-y3","Kneeling Hip Opener",3,"Kneel on one knee. Shift weight forward. Deep hip flexor release."),
    SY("s7-y4","Reclined Butterfly",4,"On back, soles together, knees wide. Arms at sides. Complete openness."),
    SY("s7-y5","Long Held Child's Pose",5,"Hold child's pose for the entire minute. Breathe into your back. Release."),
    SY("s7-y6","Micro Movements Only",6,"Notice the tiny involuntary movements of your resting body. Just observe."),
    SY("s7-y7","Commit to Stillness",7,"One final adjustment. Then: complete commitment to not moving. Rest begins."),
    SM("s7-m1","Week Reflection",8,"Seven nights of intentional rest. Notice how sleep has shifted for you."),
    SM("s7-m2","Your Sleep Rhythm",9,"Your body is remembering its natural sleep rhythm. Trust it more each day."),
    SM("s7-m3","Gratitude for Rest",10,"Thank your body for every moment of rest it has given you. It does this for you."),
    SM("s7-m4","No Agenda",11,"Tonight you have absolutely no agenda. No goal. No outcome. Just rest."),
    SM("s7-m5","Favourite Memory",12,"Let your favourite memory from this week surface gently. Hold it warmly."),
    SM("s7-m6","Sleep Mastery",13,"You are becoming someone who sleeps well. It is already happening. Believe it."),
    SM("s7-m7","Goodnight",14,"Goodnight. Your body knows exactly what to do from here. Let it. Sleep well."),
  ],
];

/* ═══════════════════════════════════════════════
   MODE 3 — FOCUS  (Breathwork + Clarity)
═══════════════════════════════════════════════ */
const FOCUS_BASE = [
  /* FOCUS DAY 1 — IGNITE */
  [
    FY("f1-y1","Box Breath Standing",1,"Inhale 4. Hold 4. Exhale 4. Hold 4. Repeat standing tall. This is control."),
    FY("f1-y2","Power Posture",2,"Feet wide, hands on hips, chin slightly up. This posture signals confidence."),
    FY("f1-y3","Seated Kapalabhati",3,"Quick sharp exhales through nose. 30 pumps. Energise your brain now."),
    FY("f1-y4","Alternate Nostril",4,"Close right nostril. Inhale left. Close left. Exhale right. Switch. Repeat."),
    FY("f1-y5","Breath of Fire",5,"Rhythmic rapid breathing through nose. Equal inhale and exhale. Fast."),
    FY("f1-y6","Ocean Breath Ujjayi",6,"Constrict throat slightly. Breathe making ocean sound. Deeply focusing."),
    FY("f1-y7","Stillness Posture",7,"Sit completely still. Notice the urge to move. Choose not to. That is focus."),
    FM("f1-m1","Single Task Intention",8,"Name the one most important task for today. Just one. Hold it clearly."),
    FM("f1-m2","Mind Clearing",9,"Imagine your mind as a whiteboard. Erase everything except that one task."),
    FM("f1-m3","Why It Matters",10,"Why does that one task matter? Go deep. Surface reason then real reason."),
    FM("f1-m4","Obstacle Scan",11,"What might prevent focus today? Name it. Now make a plan. One sentence."),
    FM("f1-m5","Energy Check",12,"Rate your energy 1-10. Whatever it is, commit to working with what you have."),
    FM("f1-m6","Flow State Prep",13,"Remember a time you were in flow. What did it feel like? Invite that back."),
    FM("f1-m7","Focus Lock",14,"Your mind is clear. Your task is set. Your energy is ready. Begin focused work."),
  ],
  /* FOCUS DAY 2 — CLARITY */
  [
    FY("f2-y1","Morning Pranayama",1,"Slow inhale 6 counts. Hold 2. Exhale 8 counts. This ratio calms and focuses."),
    FY("f2-y2","Eagle Arms Breathwork",2,"Eagle arms. Inhale, lift elbows. Exhale, lower. Synchronise movement."),
    FY("f2-y3","Warrior Breath",3,"Warrior II stance. Inhale power in. Exhale doubt out. 10 rounds."),
    FY("f2-y4","Seated Spine Breathing",4,"Sit tall. Imagine breath travelling up spine on inhale, down on exhale."),
    FY("f2-y5","Humming Bee Breath",5,"Exhale with a low hum. Feel vibration in skull. This stimulates focus."),
    FY("f2-y6","Breath Retention",6,"Inhale fully. Hold gently. Notice everything. Exhale completely. Clarity."),
    FY("f2-y7","Final Focus Breath",7,"One powerful inhale. Hold at top. Release slowly. Mind is sharp now."),
    FM("f2-m1","Priority Clarity",8,"What are the 3 most important things today? In order of importance."),
    FM("f2-m2","Time Blocking Vision",9,"Visualize your morning as time blocks. See yourself working in each one."),
    FM("f2-m3","Distraction Plan",10,"Name your top 3 distractions. For each, name one way to eliminate it now."),
    FM("f2-m4","Deep Work Mindset",11,"Deep work requires courage. You will choose discomfort over distraction today."),
    FM("f2-m5","Compound Effect",12,"Each focused session compounds. Today's work builds on yesterday's. Trust it."),
    FM("f2-m6","Identity Statement",13,"I am someone who does deep, meaningful work. I choose focus. I choose growth."),
    FM("f2-m7","Execute",14,"Enough preparation. The mind is ready. The plan is set. Go do the work now."),
  ],
  /* FOCUS DAY 3 — DEPTH */
  [
    FY("f3-y1","Cold Shower Breath Prep",1,"Fast breathing: 30 quick breaths then hold. Stimulates alertness. Wim Hof style."),
    FY("f3-y2","Inversion Prep",2,"Downward dog. Blood to brain. Hold 1 minute. Feel mental clarity arrive."),
    FY("f3-y3","Hollow Body Hold",3,"On back, lower back pressed down, legs and shoulders slightly lifted. Core on."),
    FY("f3-y4","Bridge Breath",4,"Bridge pose. Breathe into chest. Feel expansion in front body. Energy rises."),
    FY("f3-y5","Standing Exhale Fold",5,"Stand. Exhale everything out. Fold forward. Stay empty. Inhale slowly."),
    FY("f3-y6","Seated Mudra Breath",6,"Hands in Gyan mudra: index to thumb. Breathe slowly. This seals focus in."),
    FY("f3-y7","Eyes Focused One Point",7,"Pick a point. Stare at it without blinking as long as possible. Train focus."),
    FM("f3-m1","Problem Solving Mode",8,"Name one problem you need to solve today. State it as a clear question."),
    FM("f3-m2","First Principles",9,"Strip your challenge to its simplest components. What is actually true here?"),
    FM("f3-m3","Solution Brainstorm",10,"Without judgment, list every possible approach. Quantity over quality now."),
    FM("f3-m4","Best Path Forward",11,"From that list, which one path feels most right? Trust your intuition. Choose."),
    FM("f3-m5","Commit to One",12,"Focus means saying no to everything except the one path chosen. Say it: one."),
    FM("f3-m6","Think Time",13,"Great work requires time to think before doing. You just gave yourself that."),
    FM("f3-m7","Engaged Mind",14,"Your mind is engaged. Curious. Ready. This is the state great work is born from."),
  ],
  /* FOCUS DAY 4 — MOMENTUM */
  [
    FY("f4-y1","Power Stance Breath",1,"Feet wider than hips. Breathe in through nose 4 counts. Exhale mouth 4."),
    FY("f4-y2","Jumping Breath",2,"10 jumping jacks followed by 10 deep slow breaths. Wake up the body."),
    FY("f4-y3","Lion's Breath",3,"Deep inhale. Open mouth wide. Stick tongue out. Exhale with force: ha."),
    FY("f4-y4","Rhythmic Breath Walk",4,"Walk slowly. Inhale 2 steps. Exhale 2 steps. Breath and movement linked."),
    FY("f4-y5","Core Breath Lock",5,"Exhale fully. Pull navel in and up. Hold. Inhale. Release. Repeat 5 times."),
    FY("f4-y6","Finger Counting Breath",6,"Touch each finger to thumb as you breathe. One finger per count. Focus."),
    FY("f4-y7","Completion Breath",7,"Breathe in all the energy of this session. Hold it. Begin your day with it."),
    FM("f4-m1","Momentum Recall",8,"Think of a recent moment when you were in momentum. What drove it?"),
    FM("f4-m2","Start Before Ready",9,"You do not need to feel ready. You just need to begin. The feeling follows action."),
    FM("f4-m3","Two Minute Rule",10,"Anything that takes under 2 minutes: do it immediately. Clear the clutter."),
    FM("f4-m4","Depth vs Shallow",11,"Today choose depth over breadth. One thing done deeply beats five things lightly."),
    FM("f4-m5","Environment Design",12,"Your physical environment shapes your focus. What one change would help?"),
    FM("f4-m6","Accountability",13,"Who can you share your goal with today? Accountability multiplies follow-through."),
    FM("f4-m7","Now",14,"Momentum starts with this moment. Not after coffee. Not after email. Now."),
  ],
  /* FOCUS DAY 5 — PEAK STATE */
  [
    FY("f5-y1","Energy Shake",1,"Shake your hands, your shoulders, your whole body for 30 seconds. Wake up."),
    FY("f5-y2","Spine Roll Up",2,"Fold forward, then slowly roll up vertebra by vertebra. Head comes last."),
    FY("f5-y3","Lung Expansion",3,"Place hands on ribcage. Breathe into hands. Feel them expand. Repeat 8 times."),
    FY("f5-y4","Bellows Breath",4,"Fast inhales and exhales through nose. 3 rounds of 20 breaths. Energise."),
    FY("f5-y5","Coherence Breath",5,"Inhale 5 seconds. Exhale 5 seconds. Heart rate variability coherence. Calm power."),
    FY("f5-y6","Eyes Up Gaze",6,"Look up gently. This activates visual cortex differently. Think visually."),
    FY("f5-y7","Power Stillness",7,"Sit in perfect stillness. No movement. This is controlled power. Hold it."),
    FM("f5-m1","Peak Performance Visualization",8,"See yourself performing at your absolute best today. Full detail. Feel it."),
    FM("f5-m2","Success Script",9,"Narrate in your mind how today goes perfectly. Include the challenges overcome."),
    FM("f5-m3","Confidence Anchor",10,"Touch your index finger to thumb. This is your focus anchor. Set it now."),
    FM("f5-m4","Challenge Reframe",11,"The hardest task today is also your biggest growth opportunity. Seek it first."),
    FM("f5-m5","Elite Standards",12,"What would the best version of you do today? Hold that standard in mind."),
    FM("f5-m6","Legacy Thought",13,"The work you do today compounds over years. You are building something real."),
    FM("f5-m7","Ignite",14,"Body energised. Mind clear. Standards set. You are ready. This is your day."),
  ],
  /* FOCUS DAY 6 — RENEWAL */
  [
    FY("f6-y1","Morning Reset Breath",1,"Three huge sighs. Completely let go of yesterday. Today is a fresh start."),
    FY("f6-y2","Spinal Twist Breathwork",2,"Sit, twist right. Inhale. Come to center. Exhale. Twist left. Inhale. Repeat."),
    FY("f6-y3","Standing Side Breath",3,"Arm overhead, lean. Breathe into the stretched side. Open intercostals."),
    FY("f6-y4","Slow Exhale Practice",4,"Breathe in normally. Exhale as slowly as physically possible. Keep going."),
    FY("f6-y5","Breath Awareness Walk",5,"Simply walk slowly and observe your natural breath. Do not change it."),
    FY("f6-y6","Sighing Practice",6,"Allow yourself to sigh. Big audible sighs. This neurologically resets you."),
    FY("f6-y7","Seated Centering",7,"Cross-legged. Hands on knees. Spine tall. Eyes closed. Just here. Just now."),
    FM("f6-m1","Weekly Review",8,"What worked this week? Name 3 things. Acknowledge them fully before moving on."),
    FM("f6-m2","Learning Extraction",9,"What one lesson will you carry forward from this week? Make it concrete."),
    FM("f6-m3","System Upgrade",10,"What one system or habit could you improve next week? Small but meaningful."),
    FM("f6-m4","Rest as Strategy",11,"Rest is not laziness. Rest is a performance tool. Schedule it deliberately."),
    FM("f6-m5","Gratitude for Growth",12,"Thank yourself for showing up this week. Not the results. The showing up."),
    FM("f6-m6","Next Week Intention",13,"Set one word as your intention for next week. Just one. Breathe it in."),
    FM("f6-m7","Renewed",14,"You are not the same as you were 6 days ago. Growth has happened. Start fresh."),
  ],
  /* FOCUS DAY 7 — INTEGRATION */
  [
    FY("f7-y1","Breath Inventory",1,"Simply notice your breath. Fast? Slow? Shallow? Deep? No change. Awareness."),
    FY("f7-y2","Walking Meditation Breath",2,"Walk slowly. Observe: foot rise, foot fall. Breath in. Breath out. Just this."),
    FY("f7-y3","Seated 4-Count Box",3,"Box breathing: in 4. Hold 4. Out 4. Hold 4. The breath of Navy SEALs."),
    FY("f7-y4","Progressive Tension",4,"Tense entire body for 5 seconds. Release completely. Feel the contrast."),
    FY("f7-y5","Natural Breath",5,"Simply breathe naturally. Observe without interfering. Trust the body."),
    FY("f7-y6","Gratitude Breath",6,"Breathe in gratitude. Breathe out whatever is not serving you. Simple."),
    FY("f7-y7","Completion Posture",7,"Sit tall. Eyes soft. Hands open. This week's practice complete. Well done."),
    FM("f7-m1","Focus Retrospective",8,"How has your focus changed in 7 days? Be honest. Notice even small shifts."),
    FM("f7-m2","What Focus Costs",9,"Focused work costs comfort. You paid that cost this week. It was worth it."),
    FM("f7-m3","What Focus Gives",10,"The feeling of meaningful progress. Of work that matters. You created that."),
    FM("f7-m4","Identity Confirmation",11,"Seven days of choosing focus. That is who you are becoming. Own that now."),
    FM("f7-m5","Carry Forward",12,"One focus insight from this week that changes how you work permanently."),
    FM("f7-m6","Next Cycle Intention",13,"When you return to this practice, what will you bring that you lacked before?"),
    FM("f7-m7","Focused Life",14,"Focus is not a session. It is a way of living. You are practicing that life."),
  ],
];

/* ═══════════════════════════════════════════════
   MODE 4 — POSTURE  (Desk stretch + Alignment)
═══════════════════════════════════════════════ */
const POSTURE_BASE = [
  /* POSTURE DAY 1 — NECK AND SHOULDERS */
  [
    PY("p1-y1","Chin Tucks",1,"Sit tall. Gently tuck chin toward neck, making a double chin. Hold 5 sec."),
    PY("p1-y2","Neck Stretches",2,"Right ear to right shoulder. Hold 30 sec. Switch. Release built up tension."),
    PY("p1-y3","Shoulder Rolls",3,"10 slow rolls backward. Imagine squeezing a pencil between your shoulder blades."),
    PY("p1-y4","Chest Opener",4,"Clasp hands behind back. Squeeze shoulder blades. Open chest. Breathe."),
    PY("p1-y5","Upper Trap Stretch",5,"Right hand behind back. Left hand pulls head gently left. Switch."),
    PY("p1-y6","Doorway Stretch Sim",6,"Both elbows at 90°. Open arms wide. Squeeze chest. Hold 30 sec."),
    PY("p1-y7","Standing Tall",7,"Stand. Feet hip width. Stack ears over shoulders over hips. Just stand tall."),
    PM("p1-m1","Posture Check",8,"Right now how is your posture? Not judging. Just noticing. That noticing is practice."),
    PM("p1-m2","Spine Awareness",9,"Breathe into your spine. Imagine each vertebra stacking perfectly on the next."),
    PM("p1-m3","Tension Inventory",10,"Where do you hold tension in your neck and shoulders? Name each spot exactly."),
    PM("p1-m4","Desk Environment",11,"Is your screen at eye level? Is your chair supporting your lower back? Assess."),
    PM("p1-m5","Posture Habit Trigger",12,"Choose a trigger. Every time you drink water, check posture. That is your system."),
    PM("p1-m6","Body Gratitude",13,"Your spine carries you every single day. Take 30 seconds to appreciate it."),
    PM("p1-m7","Aligned Identity",14,"I am someone who takes care of my body. Posture is my baseline now."),
  ],
  /* POSTURE DAY 2 — UPPER BACK */
  [
    PY("p2-y1","Cat Cow Seated",1,"Sitting, arch back on inhale, round on exhale. 10 slow rounds. Wake spine."),
    PY("p2-y2","Thoracic Extension",2,"Sit back in chair. Clasp hands behind head. Gently arch over chair back."),
    PY("p2-y3","Foam Roller Sim",3,"Roll a towel. Place at mid-back. Lie back over it. Arms wide. Open chest."),
    PY("p2-y4","Prone Cobra",4,"Lie face down. Place hands under shoulders. Gently lift chest. Hold 10 sec."),
    PY("p2-y5","Thread the Needle",5,"Hands and knees. Slide one arm under body. Shoulder toward floor. Switch."),
    PY("p2-y6","Wall Angel",6,"Stand at wall. Arms up in W shape. Slide up and down. Activate upper back."),
    PY("p2-y7","Scapular Squeeze",7,"Sitting or standing. Squeeze shoulder blades together. Hold 10 sec. Repeat."),
    PM("p2-m1","Forward Head Awareness",8,"For every inch head moves forward, spine takes extra 10 lbs load. Feel that."),
    PM("p2-m2","Breath and Posture Link",9,"When you breathe deeply, your posture naturally improves. They are connected."),
    PM("p2-m3","Screen Time Review",10,"How many hours at screen yesterday? For each hour, what is the cost to spine?"),
    PM("p2-m4","Movement Snack Intention",11,"Set an alarm every 45 minutes to stand and do 2 minutes of movement."),
    PM("p2-m5","Muscle Memory",12,"Good posture becomes automatic with repetition. You are building that now."),
    PM("p2-m6","Pain as Signal",13,"Any current back pain is information. What is your body asking for today?"),
    PM("p2-m7","Upper Back Commitment",14,"I will check my upper back posture 5 times today. This is a small act of self care."),
  ],
  /* POSTURE DAY 3 — LOWER BACK */
  [
    PY("p3-y1","Pelvic Tilts",1,"Lie on back. Flatten lower back against floor. Hold. Release. 10 times."),
    PY("p3-y2","Knees to Chest",2,"Both knees to chest. Hold 30 sec. Rock gently. Lower back releases."),
    PY("p3-y3","Bird Dog Left",3,"Hands and knees. Extend right arm and left leg. Hold 5 sec. Return. Repeat."),
    PY("p3-y4","Bird Dog Right",4,"Switch. Extend left arm and right leg. Keep hips level. Core engaged."),
    PY("p3-y5","Glute Bridge",5,"On back, feet flat. Push hips up. Squeeze glutes at top. Hold 3 sec."),
    PY("p3-y6","Pigeon for Lower Back",6,"Pigeon pose. The hip flexors connect to lower back. Release them here."),
    PY("p3-y7","Supported Savasana",7,"Lie with pillow under knees. Lower back flattens naturally. Rest here."),
    PM("p3-m1","Sitting Awareness",8,"Humans are not built to sit for 8 hours. Your pain agrees. Act accordingly."),
    PM("p3-m2","Core as Foundation",9,"A strong core protects your lower back. These exercises build that foundation."),
    PM("p3-m3","Sleep Position",10,"How do you sleep? With pillow between knees side-lying protects lower back."),
    PM("p3-m4","Lifting Mechanics",11,"Always lift with bent knees, not bent back. Mental note: never lift twisting."),
    PM("p3-m5","Stress and Lower Back",12,"Stress stores in lower back muscles. Your tension here has an emotional source too."),
    PM("p3-m6","Long Term Investment",13,"Ten minutes daily on lower back health now prevents surgery later. Worth it."),
    PM("p3-m7","Care Commitment",14,"I am investing in my spine every day. This is not vanity. This is longevity."),
  ],
  /* POSTURE DAY 4 — HIPS AND PELVIS */
  [
    PY("p4-y1","Hip Flexor Lunge",1,"Step right foot forward, lower left knee. Shift forward. Feel right hip stretch."),
    PY("p4-y2","Hip Flexor Lunge Left",2,"Switch sides. Left foot forward. Right knee down. Hip flexors are tight from sitting."),
    PY("p4-y3","90-90 Hip Stretch",3,"Sit. Front leg in 90°. Back leg in 90°. Upright. Then fold over front leg."),
    PY("p4-y4","Lateral Hip Stretch",4,"Stand, cross right foot over left. Lean to right. Feel outer hip opening."),
    PY("p4-y5","Seated Figure Four",5,"Sit. Cross right ankle over left knee. Flex foot. Lean forward. Switch."),
    PY("p4-y6","Deep Squat Hold",6,"Feet shoulder width. Lower into deep squat. Elbows push knees wide. Hold."),
    PY("p4-y7","Hip Circles Standing",7,"Hands on hips. Make large slow circles. Both directions. 10 each way."),
    PM("p4-m1","Pelvis as Foundation",8,"Your pelvis is the foundation of your spine. Tight hips tilt pelvis. Notice it."),
    PM("p4-m2","Walking Gait Check",9,"When you walk today, notice if hips are level or if one drops. That is information."),
    PM("p4-m3","Sitting Hip Tuck",10,"Practise sitting with pelvis neutral, not tucked under. Feel the difference."),
    PM("p4-m4","Commute Opportunity",11,"Every car or transit journey is a hip flexor stretch opportunity. Sit tall."),
    PM("p4-m5","Hip Story",12,"Your hips carry the weight of how you have lived. What do yours need from you?"),
    PM("p4-m6","Movement as Medicine",13,"The best exercise for hip health is simply walking more. Aim for 8,000 steps."),
    PM("p4-m7","Open Hips Open Mind",14,"There is a reason emotions are held in hips. Notice what releases as you open them."),
  ],
  /* POSTURE DAY 5 — WRISTS AND HANDS */
  [
    PY("p5-y1","Wrist Circles",1,"Extend both arms. Make large circles with wrists. 10 each direction."),
    PY("p5-y2","Finger Extensions",2,"Spread fingers as wide as possible. Hold 5 sec. Make fist. Repeat 10 times."),
    PY("p5-y3","Prayer Stretch",3,"Prayer hands, press together, lower toward waist. Feel forearm stretch."),
    PY("p5-y4","Reverse Prayer",4,"Backs of hands together behind back. Point fingers down then up. Hold."),
    PY("p5-y5","Wrist Flexor Stretch",5,"Arm extended, palm up. Other hand bends hand back. Hold 30 sec each."),
    PY("p5-y6","Wrist Extensor Stretch",6,"Arm extended, palm down. Other hand bends hand down. Hold 30 sec each."),
    PY("p5-y7","Forearm Massage",7,"Use opposite thumb to massage up and down forearm. Find tight spots."),
    PM("p5-m1","Keyboard Awareness",8,"How are your wrists positioned at keyboard right now? They should be flat."),
    PM("p5-m2","Repetitive Strain",9,"The same movements repeated thousands of times. Notice yours. Change them."),
    PM("p5-m3","Mouse Ergonomics",10,"Is your mouse close to body? Is your shoulder relaxed while using it? Check."),
    PM("p5-m4","Break Reminder",11,"Every 30 minutes of typing: 2 minutes of wrist mobility. Set that reminder now."),
    PM("p5-m5","Tension Release",12,"Consciously relax your grip right now. On mouse, phone, pen. Ease up."),
    PM("p5-m6","Hand Gratitude",13,"Your hands type thousands of words daily. They deserve this 8 minutes."),
    PM("p5-m7","Hand Care Commitment",14,"I will check my wrist position every time I sit at my desk. This protects me."),
  ],
  /* POSTURE DAY 6 — FULL BODY ALIGNMENT */
  [
    PY("p6-y1","Mountain Pose Assessment",1,"Stand in mountain. Feet hip width. Where is your weight? Even? Front? Back?"),
    PY("p6-y2","Wall Stand Test",2,"Stand against wall. Heels, butt, upper back, and head all touching. That is neutral."),
    PY("p6-y3","Overhead Reach",3,"Both arms overhead. Can you reach without rib cage flaring? That is the test."),
    PY("p6-y4","Standing Hip Hinge",4,"Feet hip width, hinge at hips with flat back. This is how all bending should work."),
    PY("p6-y5","Single Leg Balance",5,"Stand on right leg. 30 sec. Switch. Balance is the foundation of all movement."),
    PY("p6-y6","Full Body Stretch",6,"Arms overhead, rise on toes. Breathe in. Lower on exhale. Full spine long."),
    PY("p6-y7","Aligned Standing",7,"Stand in your most aligned posture. Hold for one full minute. Feel it."),
    PM("p6-m1","Full Body Scan",8,"Head to toe posture scan. Ears over shoulders. Shoulders over hips. Hips over ankles."),
    PM("p6-m2","Gravity as Partner",9,"Good alignment means gravity works with you. Poor alignment means fighting it all day."),
    PM("p6-m3","Daily Posture Moments",10,"Name 3 daily moments to check posture. Standing in lift. At red light. Before meals."),
    PM("p6-m4","Mirror Practice",11,"Once daily, check your posture in a mirror from the side. Five seconds. Adjust."),
    PM("p6-m5","Clothes and Posture",12,"Good posture changes how you look in everything you wear. Stand taller today."),
    PM("p6-m6","Confidence Connection",13,"Posture affects mood as much as mood affects posture. Stand tall. Feel different."),
    PM("p6-m7","Alignment as Practice",14,"Like yoga or meditation, alignment is a daily practice. You are now practicing it."),
  ],
  /* POSTURE DAY 7 — DESK WARRIOR COMPLETE */
  [
    PY("p7-y1","Desk Warrior Warmup",1,"Full neck rolls. Shoulder circles. Wrist circles. Spine twist. Full sequence."),
    PY("p7-y2","Seated Spinal Twist",2,"Sit sideways in chair. Hold back of chair. Twist fully. Both sides."),
    PY("p7-y3","Hip Flexor Desk Stretch",3,"One foot on chair if safe. Other leg extends back. Hold. Switch."),
    PY("p7-y4","Hamstring Desk Stretch",4,"Sitting, extend one leg out. Flex foot. Fold gently over it. Switch."),
    PY("p7-y5","Standing Desk Sequence",5,"Stand, fold forward. Roll up. Side bend both. Chest opener. Mountain pose."),
    PY("p7-y6","Eye Exercise",6,"Eyes closed. Circle eyes slowly. Then look near then far. Eye muscles need care."),
    PY("p7-y7","Posture Reset",7,"One final standing alignment check. Ears. Shoulders. Hips. Knees. Ankles. Aligned."),
    PM("p7-m1","Week One Complete",8,"Seven days of posture care. Your spine has received more attention than it has in years."),
    PM("p7-m2","What Shifted",9,"Notice if you are already catching yourself more. Correcting more. That is the shift."),
    PM("p7-m3","Chronic vs Acute",10,"Most back pain is chronic and preventable. You are now actively preventing yours."),
    PM("p7-m4","Posture and Energy",11,"Good posture requires and creates energy. Poor posture drains it. Choose wisely."),
    PM("p7-m5","Workplace Ergonomics",12,"After this session, spend 5 minutes reviewing your full workspace setup. Worth it."),
    PM("p7-m6","Long Game Thinking",13,"You are building a body that works for decades. This week was the foundation."),
    PM("p7-m7","Desk Warrior Identity",14,"I am someone who takes care of their body even while working. That identity is set."),
  ],
];

/* ─────────────────────────────────────────────
   CYCLE HELPER — for days 8-16 in Sleep/Focus/Posture
   Cycles through the 7 base days with fresh IDs
───────────────────────────────────────────── */
function cycleDays(baseArray, dayNum) {
  const baseIdx = (dayNum - 1) % 7;
  return baseArray[baseIdx].map(step => ({
    ...step,
    id: step.id.replace(/^[a-z]\d+/, `d${dayNum}`),
    // Slightly modify cue for repeated days to feel fresh
    cue: dayNum > 7
      ? `[Week ${Math.ceil(dayNum/7)}] ${step.cue}`
      : step.cue,
  }));
}

/* ─────────────────────────────────────────────
   BUILD FULL 16-DAY ARRAYS
───────────────────────────────────────────── */
const SLEEP_SESSIONS = Array.from({length:16}, (_,i) =>
  i < 7 ? SLEEP_BASE[i] : cycleDays(SLEEP_BASE, i+1)
);

const FOCUS_SESSIONS = Array.from({length:16}, (_,i) =>
  i < 7 ? FOCUS_BASE[i] : cycleDays(FOCUS_BASE, i+1)
);

const POSTURE_SESSIONS = Array.from({length:16}, (_,i) =>
  i < 7 ? POSTURE_BASE[i] : cycleDays(POSTURE_BASE, i+1)
);

/* ─────────────────────────────────────────────
   MODE MAP — all sessions accessible by mode ID
───────────────────────────────────────────── */
const MODE_SESSIONS = {
  morning: MORNING,
  sleep:   SLEEP_SESSIONS,
  focus:   FOCUS_SESSIONS,
  posture: POSTURE_SESSIONS,
};

/* ─────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────── */

/**
 * ✅ UPGRADED — Get steps by day AND mode
 * @param {number} day  — 1 to 16
 * @param {string} mode — "morning" | "sleep" | "focus" | "posture"
 */
export function getSessionSteps(day = 1, mode = "morning") {
  const sessions = MODE_SESSIONS[mode] || MORNING;
  const index    = Math.max(0, Math.min(Number(day) - 1, 15));
  return sessions[index] || [];
}

/**
 * Get only the first-phase steps (yoga/wind-down/breathwork/stretch)
 */
export function getPhase1Steps(day = 1, mode = "morning") {
  return getSessionSteps(day, mode).filter((_, i) => i < 7);
}

/**
 * Get only the second-phase steps (meditation/sleep-prep/clarity/alignment)
 */
export function getPhase2Steps(day = 1, mode = "morning") {
  return getSessionSteps(day, mode).filter((_, i) => i >= 7);
}

/**
 * Get total duration of a session in seconds
 */
export function getSessionDuration(day = 1, mode = "morning") {
  return getSessionSteps(day, mode).reduce((sum, s) => sum + s.duration, 0);
}

/**
 * Get a single step by ID across all modes
 */
export function getStepById(id) {
  for (const sessions of Object.values(MODE_SESSIONS)) {
    for (const daySteps of sessions) {
      const found = daySteps.find(s => s.id === id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all available modes
 */
export function getAvailableModes() {
  return Object.keys(MODE_SESSIONS);
}

/**
 * Get total step count for a mode
 */
export function getTotalSteps(mode = "morning") {
  const sessions = MODE_SESSIONS[mode] || MORNING;
  return sessions.reduce((sum, day) => sum + day.length, 0);
}

/**
 * Get phase label for a step
 */
export function getPhaseLabel(step) {
  const labels = {
    "yoga":       "Yoga",
    "meditation": "Meditation",
    "wind-down":  "Wind Down",
    "sleep-prep": "Sleep Prep",
    "breathwork": "Breathwork",
    "clarity":    "Clarity",
    "stretch":    "Desk Stretch",
    "alignment":  "Alignment",
  };
  return labels[step.phase] || step.phase;
}

export {
  MORNING         as MORNING_SESSIONS,
  SLEEP_SESSIONS,
  FOCUS_SESSIONS,
  POSTURE_SESSIONS,
  MODE_SESSIONS,
};

export default MODE_SESSIONS;
