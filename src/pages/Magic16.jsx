```jsx
// src/pages/Magic16.jsx

import { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getSessionSteps } from "../constants/steps"
import confetti from "canvas-confetti"
import "../styles/magic16.css"

export default function Magic16() {
  const navigate = useNavigate()

  /* ================= STATE ================= */

  const day = Number(localStorage.getItem("magic16_streak") || 1)
  const sessionSteps = useMemo(() => getSessionSteps(day), [day])

  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(sessionSteps[0]?.duration || 30)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)

  const [xp, setXp] = useState(Number(localStorage.getItem("m16_xp") || 0))
  const [showHook, setShowHook] = useState(!localStorage.getItem("m16_started"))

  const [freeze, setFreeze] = useState(Number(localStorage.getItem("m16_freeze") || 1))

  const level = Math.floor(xp / 50)

  const leagues = ["Bronze", "Silver", "Gold", "Diamond"]
  const league = leagues[Math.min(Math.floor(day / 2), leagues.length - 1)]

  /* ================= REFS ================= */

  const timerRef = useRef(null)
  const stepRef = useRef(0)
  const timeRef = useRef(0)

  const bgAudio = useRef(null)
  const countdownAudio = useRef(null)

  const TOTAL = useMemo(() => {
    return sessionSteps.reduce((a, b) => a + b.duration, 0)
  }, [sessionSteps])

  const current = sessionSteps[stepIndex]

  /* ================= AUDIO ================= */

  useEffect(() => {
    bgAudio.current = new Audio("/assets/audio/combo.mp3")
    bgAudio.current.loop = true
    bgAudio.current.volume = 0.3

    countdownAudio.current = new Audio("/assets/audio/countdown.mp3")
    countdownAudio.current.volume = 0.7

    return () => {
      bgAudio.current?.pause()
      countdownAudio.current?.pause()
    }
  }, [])

  /* ================= VOICE ================= */

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return
    const msg = new SpeechSynthesisUtterance(text)
    msg.rate = 0.95
    msg.pitch = 1
    msg.lang = "en-US"
    speechSynthesis.cancel()
    speechSynthesis.speak(msg)
  }

  /* ================= IDENTITY ================= */

  const identities = [
    "You showed up when others didn’t.",
    "You are building discipline.",
    "You are in the top 10%.",
    "You don’t quit anymore.",
    "You are becoming elite."
  ]

  const randomIdentity = () => {
    const text = identities[Math.floor(Math.random() * identities.length)]
    speak(text)
  }

  /* ================= REWARDS ================= */

  const rewards = ["Good.", "Strong.", "Keep going.", "You're ahead."]

  const randomReward = () => {
    const r = rewards[Math.floor(Math.random() * rewards.length)]
    speak(r)
    navigator.vibrate?.(50)
  }

  /* ================= TRIGGERS ================= */

  useEffect(() => {
    const hour = new Date().getHours()

    if (hour < 10) speak("Win your morning or lose your day.")
    else if (hour < 18) speak("You’re behind. Fix it now.")
    else speak("Finish strong. Most already failed.")

    const last = localStorage.getItem("last_done")
    const today = new Date().toDateString()

    if (last && last !== today) {
      if (freeze > 0) {
        localStorage.setItem("m16_freeze", freeze - 1)
        setFreeze(freeze - 1)
        speak("Streak saved. Don't waste it.")
      } else {
        speak("You lost your streak.")
        setXp(prev => Math.max(0, prev - 20))
      }
    }

    const lastOpen = localStorage.getItem("last_open")
    const now = Date.now()

    if (!lastOpen || now - lastOpen > 6 * 60 * 60 * 1000) {
      speak("Just do one step.")
    }

    localStorage.setItem("last_open", now)

  }, [])

  /* ================= SYNC ================= */

  useEffect(() => {
    stepRef.current = stepIndex
    timeRef.current = timeLeft
  }, [stepIndex, timeLeft])

  /* ================= SAVE ================= */

  useEffect(() => {
    localStorage.setItem("m16_xp", xp)
    localStorage.setItem("m16_started", "true")
  }, [xp])

  /* ================= START ================= */

  const start = () => {
    if (timerRef.current) return

    setShowHook(false)
    setPlaying(true)

    bgAudio.current?.play().catch(() => {})
    speak(current?.guidance || current?.name)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {

        // ⚡ MICRO DOPAMINE LOOP
        if (prev % 3 === 0) {
          randomReward()
        }

        // 🧬 IDENTITY
        if (prev % 5 === 0) {
          randomIdentity()
        }

        // ⏳ COUNTDOWN
        if (prev === 5) {
          countdownAudio.current.currentTime = 0
          countdownAudio.current.play().catch(() => {})
        }

        // 💣 PRESSURE
        if (prev <= 3) {
          navigator.vibrate?.([100, 50, 100])
          speak("Don’t break now.")
        }

        if (prev <= 1) {

          const next = stepRef.current + 1

          confetti({ particleCount: 20, spread: 40 })

          // 🔥 XP SCALING
          setXp(prev => prev + (5 + Math.floor(day * 2)))

          if (next >= sessionSteps.length) {
            finish()
            return 0
          }

          setStepIndex(next)
          speak(sessionSteps[next].guidance)

          return sessionSteps[next].duration
        }

        return prev - 1
      })

      /* PROGRESS */
      setProgress(() => {
        const doneSteps = sessionSteps
          .slice(0, stepRef.current)
          .reduce((a, b) => a + b.duration, 0)

        const currentDone =
          sessionSteps[stepRef.current]?.duration - timeRef.current

        return Math.floor(((doneSteps + currentDone) / TOTAL) * 100)
      })

    }, 1000)
  }

  /* ================= STOP ================= */

  const stop = () => {
    clearInterval(timerRef.current)
    timerRef.current = null
    setPlaying(false)

    bgAudio.current?.pause()
    countdownAudio.current?.pause()
    speechSynthesis.cancel()

    speak("Paused. Don’t stay weak.")
  }

  /* ================= FINISH ================= */

  const finish = () => {
    stop()

    confetti({ particleCount: 250, spread: 120 })

    const streak = Number(localStorage.getItem("magic16_streak") || 0) + 1
    localStorage.setItem("magic16_streak", streak)
    localStorage.setItem("last_done", new Date().toDateString())

    speak("You are not average anymore.")

    setTimeout(() => {
      navigate("/result", {
        state: {
          score: streak * 10,
          accuracy: 90 + Math.floor(Math.random() * 10),
          time: "16:00",
          xpEarned: 50,
          completed: true
        }
      })
    }, 1200)
  }

  /* ================= SHARE ================= */

  const handleShare = async () => {
    const text = `🔥 Day ${day} completed.

92% of people quit before Day 5.
I didn’t.

Can you?

${window.location.origin}`

    try {
      if (navigator.share) {
        await navigator.share({ title: "Magic16", text })
      } else {
        await navigator.clipboard.writeText(text)
        speak("Copied. Share it.")
      }
    } catch {}
  }

  /* ================= HOOK ================= */

  useEffect(() => {
    if (showHook) {
      const t = setTimeout(() => start(), 1500)
      return () => clearTimeout(t)
    }
  }, [showHook])

  if (showHook) {
    return (
      <div className="hook">
        <h1>92% of people quit before Day 5.</h1>
        <p>Are you in the 8%?</p>
        <button onClick={start}>Start Now 🔥</button>
      </div>
    )
  }

  if (!current) return null

  const fakeRank = 1000 - day * 37 + Math.floor(Math.random() * 20)

  /* ================= UI ================= */

  return (
    <div className="magic16">

      <div className="top">
        <h3>🔥 Day {day}</h3>
        <h4>{league} League • Level {level}</h4>
        <p>XP {xp} • Rank #{fakeRank}</p>
      </div>

      <img src={current.image} alt="" className="image" />

      <h2>{current.name}</h2>
      <p>{current.guidance}</p>

      <div className={`timer ${
        timeLeft <= 5 ? "danger" :
        timeLeft <= 10 ? "warning" : ""
      }`}>
        <h1>{timeLeft}</h1>
      </div>

      <div className="progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      <p className="remaining">
        {100 - progress}% left to beat today
      </p>

      <button onClick={playing ? stop : start}>
        {playing ? "Pause" : "Start"}
      </button>

      <button onClick={handleShare} className="share">
        Share 🔥
      </button>

    </div>
  )
}
```
