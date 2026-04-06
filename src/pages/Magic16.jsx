import * as posedetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as tf from "@tensorflow/tfjs"
import confetti from "canvas-confetti"
import { supabase } from "../supabaseClient"
import "../styles/magic16.css"
import logo from "../assets/logo.png"
import html2canvas from "html2canvas"
/* yoga images */
import yoga1 from "../assets/steps/yoga-01.png"
import yoga2 from "../assets/steps/yoga-02.png"
import yoga3 from "../assets/steps/yoga-03.png"
import yoga4 from "../assets/steps/yoga-04.png"
import yoga5 from "../assets/steps/yoga-05.png"
import yoga6 from "../assets/steps/yoga-06.png"
import yoga71 from "../assets/steps/yoga-07-1.png"
import yoga72 from "../assets/steps/yoga-07-2.png"
import yoga73 from "../assets/steps/yoga-07-3.png"
import yoga8 from "../assets/steps/yoga-08.png"

/* meditation images */
import med1 from "../assets/steps/med-01.png"
import med2 from "../assets/steps/med-02.png"
import med3 from "../assets/steps/med-03.png"
import med4 from "../assets/steps/med-04.png"
import med5 from "../assets/steps/med-05.png"
import med6 from "../assets/steps/med-06.png"
import med7 from "../assets/steps/med-07.png"

import successSound from "../assets/audio/success.mp3"
import failSound from "../assets/audio/fail.mp3"
import comboSound from "../assets/audio/combo.mp3"
import countdownSound from "../assets/audio/countdown.mp3" 
const winSound = new Audio("../assets/audio/win.mp3")

/* meditation audio */
import meditationAudio from "../assets/audio/meditation/meditation.mp3"
import { useRef, useEffect, useState } from "react"
export default function Magic16(){

/* ---------------- REFS ---------------- */
const videoRef = useRef(null)
const detectorRef = useRef(null)
const detectRef = useRef(null)
const timerRef = useRef(null)

// 🔊 AUDIO SYSTEM (FIXED PATHS)
const successSoundRef = useRef(new Audio(successSound))
const failSoundRef = useRef(new Audio(failSound))
const comboSoundRef = useRef(new Audio(comboSound))
const meditationRef = useRef(new Audio(meditationAudio))

/* ---------------- CORE STATE ---------------- */

// 🎮 gameplay
const [score, setScore] = useState(0)
const [combo, setCombo] = useState(0)
const [stepIndex, setStepIndex] = useState(0)
const [stepTime, setStepTime] = useState(60)
const [playing, setPlaying] = useState(false)
const [completed, setCompleted] = useState(false)
const [dailySteps, setDailySteps] = useState([]);
const [scores, setScores] = useState([]);
const [points, setPoints] = useState(0);
const [reward, setReward] = useState("");
const [lastScore, setLastScore] = useState(0);
const [coach, setCoach] = useState("");
const [userId, setUserId] = useState(localStorage.getItem("magic16_user") || crypto.randomUUID());
const audioRef = useRef(null);

// 📊 progress
const [progress, setProgress] = useState(0)
const [xp, setXp] = useState(0)
const xpToNext = 100
const [level, setLevel] = useState("Beginner")

// 🏆 results
const [finalScore, setFinalScore] = useState(0)
const [leaderboard, setLeaderboard] = useState([])
const [userRank, setUserRank] = useState(null)

// 👥 social
const [friendScore, setFriendScore] = useState(0)
const [ghostScore, setGhostScore] = useState(0)

// 🔥 streak system
const [streak, setStreak] = useState(() =>
  Number(localStorage.getItem("magic16_streak") || 0)
)
const [missedDay, setMissedDay] = useState(false)

// 📅 history (FIXED)
const [history, setHistory] = useState(() =>
  JSON.parse(localStorage.getItem("magic16_history") || "[]")
)

// 🎯 goals
const [dailyGoal] = useState(80)
const [goalAchieved, setGoalAchieved] = useState(false)

// ⚡ UX states
const [loading, setLoading] = useState(true)

// 🎲 variation text
const variationMessages = [
  "New energy today 🔥",
  "Different flow, better growth 💪",
  "Your body adapts faster today ⚡"
]

const [variationText] = useState(
  variationMessages[Math.floor(Math.random() * variationMessages.length)]
)

// 📊 yesterday comparison
const [yesterdayScore] = useState(() =>
  Number(localStorage.getItem("magic16_lastScore") || 0)
)

/* ---------------- HUMAN COACH MESSAGES ---------------- */
const healthMessages = {
  excellent: [
    "🔥 Excellent posture! Spine alignment on point.",
    "💪 Great control! Balance improving fast.",
    "⚡ Epic! Keep slaying your yoga flow.",
    "🏆 Legendary! Your body is leveling up."
  ],

  good: [
    "🙂 Good posture! Keep breathing slowly.",
    "👌 Doing well! Stay relaxed and focused.",
    "✨ Nice flow! You're getting stronger each time.",
    "💎 Solid! Keep the streak going."
  ],

  improve: [
    "⬆️ Lift your chest slightly for perfect form.",
    "🧘 Relax your shoulders and lengthen your spine.",
    "⚠️ Adjust your posture, you got this!",
    "🔥 Focus! Small tweaks = big gains."
  ]
}

/* ---------------- VOICE COACH ---------------- */
const speak = (text, options = {}) => {
  if (!window.speechSynthesis) return

  speechSynthesis.cancel()

  const msg = new SpeechSynthesisUtterance(text)

  // Randomize slightly for more human-like vibe
  msg.rate = options.rate || (0.85 + Math.random() * 0.15)
  msg.pitch = options.pitch || (0.9 + Math.random() * 0.2)
  msg.lang = "en-US"

  // Optional callback when done speaking
  if (options.onEnd) msg.onend = options.onEnd

  speechSynthesis.speak(msg)
}

// Example usage:
speak("🔥 Excellent posture! Keep going!", { rate: 1, pitch: 1.1 })
speak("💪 Great flow! Streak +1!", { rate: 0.95, pitch: 1 })

/* ---------------- MOVEMENT ANALYSIS ---------------- */
const analyzeMovement = (score) => {
  let level

  if (score > 85) {
    level = "excellent"
    successSoundRef.current.play()
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } })
  } else if (score > 65) {
    level = "good"
    comboSoundRef.current.play()
  } else {
    level = "improve"
    failSoundRef.current.play()
  }

  const messages = healthMessages[level]

  // Randomly pick a message & add hype emoji
  const message =
    messages[Math.floor(Math.random() * messages.length)] +
    (level === "excellent" ? " 🔥💪" : level === "good" ? " ⚡😊" : " ⚠️🤏")

  // Update coach text
  setCoach(message)

  // Speak message dynamically
  speak(message)
}

/* ---------------- STEPS ---------------- */

const steps=[

{type:"yoga",img:yoga1,text:"Mountain Pose. Stand tall.",duration:60},
{type:"yoga",img:yoga2,text:"Forward Fold. Relax your spine.",duration:60},
{type:"yoga",img:yoga3,text:"Half Lift. Lengthen your back.",duration:60},
{type:"yoga",img:yoga4,text:"Plank Pose. Engage your core.",duration:60},
{type:"yoga",img:yoga5,text:"Cobra Pose. Open your chest.",duration:60},
{type:"yoga",img:yoga6,text:"Downward Dog. Stretch your body.",duration:60},
{type:"yoga",img:yoga71,text:"Warrior One.",duration:60},
{type:"yoga",img:yoga72,text:"Warrior Two.",duration:60},
{type:"yoga",img:yoga73,text:"Warrior Three.",duration:60},
{type:"yoga",img:yoga8,text:"Tree Pose. Balance your body.",duration:60},

{type:"meditation",img:med1,text:"Close your eyes and breathe slowly.",duration:120},
{type:"meditation",img:med2,text:"Focus on breathing.",duration:120},
{type:"meditation",img:med3,text:"Release tension.",duration:120},
{type:"meditation",img:med4,text:"Feel calm.",duration:120},
{type:"meditation",img:med5,text:"Let thoughts pass.",duration:120},
{type:"meditation",img:med6,text:"Stay present.",duration:120},
{type:"meditation",img:med7,text:"Visualize success.",duration:120}

]
const loadChallenge = async (id) => {

  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) return

  if (data.host_id === userId) {
    setFriendScore(data.friend_score || 0)
  } else {
    setFriendScore(data.host_score || 0)
  }
}
// ✅ state
const [totalTime, setTotalTime] = useState(0)
const urlParams = new URLSearchParams(window.location.search)
const challengeId = urlParams.get("challenge")
  const loadLeaderboard = async () => {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(10)

  if (!error) setLeaderboard(data)
}
  const createChallenge = async () => {

  const { data } = await supabase
    .from("challenges")
    .insert([{ host_id: userId }])
    .select()

  if (data) {
    const id = data[0].id
    const link = `${window.location.origin}?challenge=${id}`

    await navigator.clipboard.writeText(link)
    alert("🔥 Challenge link copied!")
  }
}
 
/* ---------------- INIT MAGIC16 ---------------- */
useEffect(() => {

  const shuffleArray = (array) => {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
 if(combo >= 3){
    confetti({ particleCount: 25, spread: 80 })
    comboSoundRef.current.currentTime = 0
    comboSoundRef.current.play().catch(()=>{})
  }
}, [combo])

// ⚡ reward at quickStart end
const quickStartFinish = () => {
  setPlaying(false)
  setReward("🏆 Quick session complete! +10 XP")
  setXp(prev => Math.min(prev + 10, xpToNext))
  confetti({ particleCount: 50, spread: 100 })
  speak("Quick session complete! Well done.")
}

  const init = async () => {
    const userId =
      localStorage.getItem("magic16_user") || crypto.randomUUID()
    localStorage.setItem("magic16_user", userId)

    // 📸 CAMERA
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error("Camera error:", err)
      alert("Camera access is required")
      return
    }

    // 📅 STREAK SYSTEM
    const today = new Date().toDateString()
    const lastDate = localStorage.getItem("magic16_lastDate")
    if (lastDate) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (lastDate !== today && lastDate !== yesterday.toDateString()) {
        setStreak(0)
        localStorage.setItem("magic16_streak", 0)
        alert("⚠ You lost your streak!")
      }
    }

    // 📊 LEADERBOARD
    await loadLeaderboard()

    // 🔗 CHALLENGE SYSTEM
    if (challengeId) {
      await supabase
        .from("challenges")
        .update({ friend_id: userId })
        .eq("id", challengeId)
      await loadChallenge(challengeId)
    }

    // 🎯 DAILY VARIATION
    let savedDate = localStorage.getItem("magic16_variation_date")
    let savedSteps = localStorage.getItem("magic16_variation_steps")
    if (savedDate === today && savedSteps) {
      setDailySteps(JSON.parse(savedSteps))
    } else {
      const yogaSteps = steps.filter(s => s.type === "yoga")
      const meditationSteps = steps.filter(s => s.type === "meditation")
      const newSteps = [...shuffleArray(yogaSteps), ...meditationSteps]
      setDailySteps(newSteps)
      localStorage.setItem("magic16_variation_date", today)
      localStorage.setItem("magic16_variation_steps", JSON.stringify(newSteps))
    }

    // 🧠 POSE DETECTION
    await tf.ready()
    await tf.setBackend("webgl")
    detectorRef.current = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet,
      { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    )

    // 🔊 AUDIO
    audioRef.current = new Audio(meditationAudio)
    audioRef.current.loop = true
    audioRef.current.volume = 0.4

    // ✅ VIRAL HOOKS: preload success/fail/combo sounds
    successSoundRef.current = new Audio(successSound)
    failSoundRef.current = new Audio(failSound)
    comboSoundRef.current = new Audio(comboSound)

    setLoading(false)
  }

  init()

  return () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(detectRef.current)
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
  }
}, [])
/* ---------------- POSE DETECTION ---------------- */
const detectPose = async () => {
  if (!detectorRef.current || !videoRef.current) return

  const poses = await detectorRef.current.estimatePoses(videoRef.current)
  if (!poses.length) return

  const kp = poses[0].keypoints
  const hip = kp.find(k => k.name === "left_hip")
  const knee = kp.find(k => k.name === "left_knee")
  const ankle = kp.find(k => k.name === "left_ankle")

  if (hip && knee && ankle) {
    const angle = Math.abs(
      Math.atan2(ankle.y - knee.y, ankle.x - knee.x) -
      Math.atan2(hip.y - knee.y, hip.x - knee.x)
    ) * 180 / Math.PI

    const sc = Math.round(Math.max(0, 100 - Math.abs(angle - 90)))

    setScore(sc)

    // ✅ Compute new combo value correctly
    const newCombo = sc > 80 ? combo + 1 : 0
    setCombo(newCombo)

    // 🎯 Update score array & rewards
    setScores(prev => {
      const updated = [...prev, sc].slice(-50)

      if (updated.length === 20) {
        speak(`Your posture score is ${sc}%`)
        setReward(`⚡ Your posture: ${sc}%`)
      }

      if (sc > 90) {
        setReward("💥 PERFECT!")
        confetti({ particleCount: 30, spread: 70, origin: { y: 0.6 } })
      }

      return updated
    })

    // 🔊 Sound feedback
    if (sc > lastScore + 8) {
      try {
        successSoundRef.current.currentTime = 0
        successSoundRef.current.play()
      } catch {}
      setReward("🔥 Great posture! +8")
    }

    if (newCombo === 4) {
      try {
        comboSoundRef.current.currentTime = 0
        comboSoundRef.current.play()
      } catch {}
      confetti({ particleCount: 50, spread: 90, origin: { y: 0.5 } })
    }

    // ✅ Points & XP
    setPoints(prev => prev + 8)
    setXp(prev => Math.min(prev + 5, xpToNext))

    // 🕒 Reward timer
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setReward(""), 1500)

    setLastScore(sc)

    // 💡 Human coach feedback
    analyzeMovement(sc)
  }

  // 🔁 Loop detection at ~10 FPS
  detectRef.current = requestAnimationFrame(detectPose)
}
/* - - - - - - quickstart & start - - - - - - */
const runDetection = () => {
  detectPose()
  detectRef.current = requestAnimationFrame(runDetection)
}

const finish = () => {
  // Example finish logic, adjust per your app
  setPlaying(false)
  clearInterval(timerRef.current)
  clearTimeout(timeoutRef.current)
  cancelAnimationFrame(detectRef.current)
  speechSynthesis.cancel()
  setCombo(0)
  setPoints(0)
  setLastScore(0)
  setScores([])
}

const quickStart = () => {
  setCombo(0)
  setPoints(0)
  setXp(0)
  setLastScore(0)
  setScore(0)
  setScores([])
  setPlaying(true)

  speak("Quick recovery session started")

  // only 2 steps (short)
  setStepIndex(0)
  setStepTime(30)

  runDetection()

  timeoutRef.current = setTimeout(() => {
    finish()
  }, 120000) // 2 minutes
}

const start = () => {
  setScores([])
  setPoints(0)
  setLastScore(0)

  if (playing) return

  setPlaying(true)

  speak(`Welcome to Magic sixteen. ${dailySteps[0]?.text}`)

  runDetection()
// calculate total time from dailySteps
  const initialTotal = dailySteps.reduce((sum, step) => sum + step.duration, 0)
  setTotalTime(initialTotal)
  setProgress(0)
  timerRef.current = setInterval(() => {
    const [initialTotal, setInitialTotal] = useState(dailySteps.reduce((sum, step) => sum + step.duration, 0))
    setTotalTime(prevTotal => {
      const newTotal = prevTotal - 1
      setProgress(Math.round(((initialTotal - newTotal) / initialTotal) * 100))
      return newTotal
    })

    setStepTime(prev => {
      if (prev <= 1) {
        setStepIndex(prevIndex => {
          const next = prevIndex + 1
          if (next >= dailySteps.length) {
            finish()
            return prevIndex
          }

          if (dailySteps[next].type === "meditation") {
            audioRef.current?.play()
          } else {
            audioRef.current?.pause()
          }

          speak(dailySteps[next].text)
          setStepTime(dailySteps[next].duration)
          return next
        })
        return 0
      }
      return prev - 1
    })
  }, 1000)
}

const stop = () => {
  clearInterval(timerRef.current)
  clearTimeout(timeoutRef.current)
  cancelAnimationFrame(detectRef.current)
  speechSynthesis.cancel()
  audioRef.current?.pause()
  audioRef.current.currentTime = 0

  setPlaying(false)
  setCombo(0)
  setPoints(0)
}
/* ---------------- FINISH ---------------- */

const finish = async () => {
  const lastDate = localStorage.getItem("magic16_lastDate")
  const today = new Date().toDateString()

  // ✅ calculate average score
  const avgScore =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0

  const calculatedFinalScore = Math.round(avgScore)

  // ✅ save daily history (last 7 days)
  const historyData = JSON.parse(localStorage.getItem("magic16_history") || "[]")
  historyData.push({
    date: today,
    score: calculatedFinalScore,
    success: calculatedFinalScore >= dailyGoal
  })
  if (historyData.length > 7) historyData.shift()
  localStorage.setItem("magic16_history", JSON.stringify(historyData))

  // ✅ update streak
  let s = Number(localStorage.getItem("magic16_streak") || 0)
  if (lastDate !== today) {
    s++
    localStorage.setItem("magic16_streak", s)
    setStreak(s)
  }

  // ✅ update level
  if (s > 50) setLevel("Zen Master")
  else if (s > 20) setLevel("Master")
  else if (s > 5) setLevel("Explorer")
  else setLevel("Beginner")

  // ✅ visual/audio feedback
  confetti({ particleCount: 200, spread: 120 })
  const winSound = new Audio("../assets/audio/win.mp3")
  winSound.play().catch(() => {})

  setFinalScore(calculatedFinalScore)
  setGoalAchieved(calculatedFinalScore >= dailyGoal)
  
  // ✅ Save yesterday score outside hook
  localStorage.setItem("magic16_lastScore", calculatedFinalScore)
  localStorage.setItem("magic16_lastDate", today)
  setCompleted(true)

  // ✅ save/update leaderboard
  await supabase
    .from("leaderboard")
    .upsert(
      { user_id: userId, score: calculatedFinalScore },
      { onConflict: ["user_id"] }
    )

  // ✅ handle challenge score
  if (challengeId) {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single()
    if (data) {
      if (data.host_id === userId) {
        await supabase
          .from("challenges")
          .update({ host_score: calculatedFinalScore })
          .eq("id", challengeId)
      } else {
        await supabase
          .from("challenges")
          .update({ friend_score: calculatedFinalScore })
          .eq("id", challengeId)
      }
    }
  }

  // ✅ get rank
  const { data: allScores } = await supabase
    .from("leaderboard")
    .select("score")
    .order("score", { ascending: false })
  const rank =
    allScores.findIndex(p => p.score === calculatedFinalScore) + 1
  setUserRank(rank)
}
/* ---------------- ONE MINUTE RESET ---------------- */

const oneMinReset = () => {
  stop()
  setPlaying(true)
  setScore(0)
  setPoints(0)

  speak("1 minute reset")

  setTimeout(() => {
    speak("Can you beat this?")
  }, 1500)

  let time = 60
  timerRef.current = setInterval(() => {
    time--
    if (time <= 0) {
      clearInterval(timerRef.current)
      stop()
      speak("Reset complete")
    }
  }, 1000)
}

/* ---------------- SHARE ---------------- */

const share = async () => {
  const card = document.getElementById("share-card")
  if (!card) return

  const canvas = await html2canvas(card)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"))
 if (!blob) return alert("Failed to capture image")
  const file = new File([blob], "magic16.png", { type: "image/png" })

  // 🎉 combo shake effect
  if (combo >= 4) {
    document.body.classList.add("shake")
    setTimeout(() => document.body.classList.remove("shake"), 200)
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: "🔥 Can you beat me?",
        text: `I scored ${finalScore}% 😈`,
        files: [file]
      })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "magic16.png"
      a.click()
      alert("Image downloaded. Share it 🚀")
    }
  } catch (e) {
    console.log("Share cancelled")
  }
}

/* ---------------- COMPLETED SCREEN ---------------- */

if (completed) {
  return (
    <div className="magic16-complete">
      <h1>🎉 Ritual Complete</h1>
      <h2>{finalScore}% Posture Score</h2>

      <p className="magic16-challenge">
        🔥 Beat this score tomorrow to keep your streak alive
      </p>

      <p className="magic16-compare">
        Yesterday: {yesterdayScore}% <br />
        Today: {finalScore}%{" "}
        {finalScore > yesterdayScore
          ? `+${finalScore - yesterdayScore}% 🔥`
          : finalScore < yesterdayScore
          ? `${finalScore - yesterdayScore}% ⚡`
          : "No Change"}
      </p>

      <p className="magic16-goal">
        🎯 Today's Goal: {dailyGoal}%
      </p>
      <p className="magic16-goal-result">
        {goalAchieved ? "✅ Goal Achieved!" : "❌ Goal Not Reached"}
      </p>

      <p>🔥 {streak} Day Streak</p>
      <p>Level: {level}</p>
      <p>{coach}</p>

      <div className="magic16-leaderboard">
        <h3>🏆 Today’s Top</h3>
        {leaderboard.map((p, i) => (
          <p key={i}>
            #{i + 1} — {p.score}%
            {p.user_id === userId && " 👈 YOU"}
          </p>
        ))}

        <hr />

        <h3>📍 Your Rank Zone</h3>
        {(() => {
          const all = [...leaderboard, { score: finalScore, user_id: userId }].sort(
            (a, b) => b.score - a.score
          )
          const index = all.findIndex(p => p.score === finalScore && p.user_id === userId)
          const slice = all.slice(Math.max(0, index - 2), index + 3)
          return slice.map((p, i) => (
            <p
              key={i}
              style={{
                color: p.score === finalScore && p.user_id === userId ? "yellow" : "white"
              }}
            >
              {p.score === finalScore && p.user_id === userId ? "👉 YOU — " : ""}
              {p.score}%
            </p>
          ))
        })()}
      </div>

      <div className="magic16-actions">
        <button onClick={share}>📤 Share</button>
        <button onClick={() => window.location.reload()}>🔄 Start Again</button>
        <button onClick={oneMinReset}>⚡ 1-Min Reset</button>
      </div>

      <div className="magic16-history">
        {history.map((d, i) => (
          <span key={i} className="history-icon">
            {d.success ? "✅" : "❌"}
          </span>
        ))}
      </div>
    </div>
  )
}
/* ---------------- MAIN UI ---------------- */

const today = new Date().toLocaleDateString()

const calendarDays = history.slice(-7).map(day => {
  let level = "none"

  if (day.score >= 80) level = "high"
  else if (day.score >= 60) level = "medium"
  else if (day.score > 0) level = "low"

  return {
    ...day,
    level,
    isToday: day.date === today
  }
})

return (
  <div className="magic16-app">
    {/* ---------- HEADER ---------- */}
    <header className="magic16-header">
      <img src={logo} alt="Magic16 Logo" />
      <div className="magic16-streak">🔥 {streak} Day Streak</div>
      <div className="magic16-xp">
        <div className="xp-bar">
          <div style={{ width: `${(xp / xpToNext) * 100}%` }} />
        </div>
        <p>XP: {xp}/{xpToNext}</p>
      </div>
    </header>

    {loading && (
      <div className="magic16-loading">
        Preparing AI Trainer...
      </div>
    )}

    <div className="magic16-layout">
      {/* ---------- CAMERA ---------- */}
      <div className="magic16-camera">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="magic16-video"
        />
      </div>

      <div className="magic16-goal-box">
        🎯 Today's Goal: Score above {dailyGoal}%
      </div>

      {/* ---------- PANEL ---------- */}
      <div className="magic16-panel">
        <h3 className="magic16-variation">🔥 Today’s Variation</h3>
        <p>{variationText}</p>

        {missedDay && !playing && (
          <div className="magic16-warning">
            ⚠ Missed yesterday?  
            <p>You can recover your streak with a quick 2-minute session</p>
            <button onClick={quickStart}>
              Save Streak (2 min)
            </button>
          </div>
        )}

        <img
          src={dailySteps[stepIndex]?.img}
          className="magic16-step-img"
          alt="Current Step"
        />

        <h3>🏆 Global Rank: #{userRank}</h3>

        <div className="magic16-friends">
          <h3>👥 Friends</h3>
          <p>Friend: {friendScore}%</p>
          <p>You: {score}%</p>
          <p>
            {score > friendScore 
              ? "🔥 You are winning!" 
              : "⚡ Beat your friend!"}
          </p>
          <p>Top 10% players score 90%+</p>
          <p>Can you beat me? 😈</p>
        </div>

        <p>👻 Yesterday: {yesterdayScore}%</p>  
        <p>🔴 You: {score}% {score > yesterdayScore ? "🔥 Winning" : "⚡ Catch up"}</p>
      </div>

      <h2>{dailySteps[stepIndex]?.text}</h2>

      <p className="magic16-coach">{coach}</p>

      {reward && (
        <div className="magic16-reward">{reward}</div>
      )}

      <div className="magic16-progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      {/* ---------- CALENDAR ---------- */}
      <div className="magic16-calendar">
        <h3>📅 Last 7 Days</h3>
        <div className="calendar-grid">
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={`
                calendar-day 
                ${day.level} 
                ${day.isToday ? "today" : ""}
              `}
              title={`Score: ${day.score || 0}%`}
            />
          ))}
        </div>

        <div id="share-card" style={{
          width: "300px",
          padding: "20px",
          background: "#0f172a",
          color: "white",
          borderRadius: "20px",
          textAlign: "center",
          position: "absolute",
          left: "-9999px"
        }}>
          <h2>🔥 Magic16</h2>
          <h1 style={{ fontSize: "40px" }}>{finalScore}%</h1>
          <p>Posture Score</p>
          <p>🏆 Rank #{userRank}</p>
          <p>🔥 {streak} Day Streak</p>
          <p style={{ marginTop: "10px" }}>Beat me if you can 😈</p>
        </div>

        <h3>📅 Your Consistency</h3>
        <p className="subtext">Stay green to build your streak 🔥</p>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="magic16-stats">
        <span>Step {stepTime}s</span>
        <span>Score {score}%</span>
        <span>⭐ {points} pts</span>
      </div>

      <button onClick={createChallenge}>🔥 Challenge a Friend</button>

      {/* ---------- CONTROLS ---------- */}
      <div className="magic16-controls">
        <button onClick={oneMinReset} className="quick-btn">⚡ Quick Reset</button>
        {!playing ? (
          <button onClick={start}>Start Magic16</button>
        ) : (
          <button onClick={stop}>Pause</button>
        )}
      </div>
    </div>
  </div>
)
