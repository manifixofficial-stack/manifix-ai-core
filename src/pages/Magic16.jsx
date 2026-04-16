// src/pages/Magic16.jsx

import { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getSessionSteps } from "../constants/steps"
import confetti from "canvas-confetti"
import "../styles/magic16.css"

export default function Magic16() {

  const navigate = useNavigate()

  /* ================= STATE ================= */

  const [stepIndex, setStepIndex] = useState(() =>
    Number(localStorage.getItem("m16_step") || 0)
  )

  const [timeLeft, setTimeLeft] = useState(() =>
    Number(localStorage.getItem("m16_time")) || steps[0].duration
  )

  const [progress, setProgress] = useState(() =>
    Number(localStorage.getItem("m16_progress") || 0)
  )

  const [playing, setPlaying] = useState(false)

  const [xp, setXp] = useState(() =>
    Number(localStorage.getItem("m16_xp") || 0)
  )

  const [showHook, setShowHook] = useState(() => {
    return !localStorage.getItem("m16_started")
  })

  const timerRef = useRef(null)
  const stepRef = useRef(stepIndex)
  const timeRef = useRef(timeLeft)

  /* ================= DERIVED ================= */

 const sessionSteps = getSessionSteps(stepIndex + 1)
const current = sessionSteps[currentStepIndex]

  const TOTAL = useMemo(() => {
    return steps.reduce((a, b) => a + b.duration, 0)
  }, [])

  /* ================= SYNC ================= */

  useEffect(() => {
    stepRef.current = stepIndex
    timeRef.current = timeLeft
  }, [stepIndex, timeLeft])

  /* ================= CLEANUP ================= */

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  /* ================= PERSIST ================= */

  useEffect(() => {
    localStorage.setItem("m16_step", stepIndex)
    localStorage.setItem("m16_time", timeLeft)
    localStorage.setItem("m16_progress", progress)
    localStorage.setItem("m16_started", true)
    localStorage.setItem("m16_xp", xp)
  }, [stepIndex, timeLeft, progress, xp])

  /* ================= VOICE ================= */

  const speak = (text, type = "normal") => {
    if (!("speechSynthesis" in window)) return

    const voices = speechSynthesis.getVoices()
    const voice =
      voices.find(v => v.name.includes("Google")) ||
      voices.find(v => v.lang === "en-US") ||
      voices[0]

    const msg = new SpeechSynthesisUtterance(text)
    msg.voice = voice

    msg.rate = type === "motivation" ? 1 : 0.9
    msg.pitch = type === "motivation" ? 1.2 : 1

    if (speechSynthesis.speaking) speechSynthesis.cancel()
    speechSynthesis.speak(msg)
  }

  /* ================= HOOK ================= */

  useEffect(() => {
    if (showHook) {
      speak("You won’t finish this. Most people quit.")
    }
  }, [showHook])

  /* ================= TIMER ================= */

  const start = () => {
    if (timerRef.current) return

    setShowHook(false)
    setPlaying(true)

    speak(current.voice, "motivation")

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {

        if (prev <= 1) {

          setStepIndex(i => {
            const next = i + 1

            if (next >= steps.length) {
              finish()
              return i
            }

            speak(steps[next].voice)
            setTimeLeft(steps[next].duration)

            return next
          })

          return 0
        }

        if (prev === 10) speak("You're still here.")
        if (prev === 5) speak("Most people quit here.")
        if (prev === 2) speak("Finish it.")

        return prev - 1
      })

      setProgress(() => {
        const elapsed =
          steps
            .slice(0, stepRef.current)
            .reduce((a, b) => a + b.duration, 0) +
          (steps[stepRef.current].duration - timeRef.current)

        return Math.floor((elapsed / TOTAL) * 100)
      })

    }, 1000)
  }

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    speechSynthesis.cancel()
    speak("Paused.")
    setPlaying(false)
  }

  /* ================= FINISH ================= */

  const finish = () => {
    stop()

    confetti({ particleCount: 150, spread: 90 })
    setTimeout(() => {
      confetti({ particleCount: 200, spread: 120 })
    }, 400)

    const prevStreak = Number(localStorage.getItem("magic16_streak") || 0)
    const streak = prevStreak + 1

    const newXp = xp + 50

    localStorage.setItem("magic16_streak", streak)
    localStorage.setItem("last_done", new Date().toISOString())

    /* 🔥 SAVE RESULT (IMPORTANT) */
    localStorage.setItem("m16_last_result", JSON.stringify({
      day,
      xp: newXp,
      streak,
      date: new Date().toISOString()
    }))

    speak(`Day complete. ${streak} day streak.`)

    setTimeout(() => {
      navigate("/result")
    }, 1200)
  }

  /* ================= UI ================= */

  if (showHook) {
    return (
      <div className="hook">
        <h1>⚠️ You won’t finish this</h1>
        <p>92% quit before Day 5.</p>
        <button onClick={start}>Start Anyway 🔥</button>
      </div>
    )
  }

  return (
    <div className={`magic16 day-${day}`}>

      <div className="top">
        <h3>🔥 Day {day} / 16</h3>
      </div>

      <div className="image-wrapper">
        <img src={current.img} alt="" />
      </div>

      <div className="content">
        <h2>{current.title}</h2>
        <p>{current.purpose}</p>
      </div>

      <div className={`timer ${timeLeft <= 5 ? "danger" : ""}`}>
        <h1>{timeLeft}</h1>
      </div>

      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
        <span>{progress}%</span>
      </div>

      <button
        className={`cta ${playing ? "pause" : "start"}`}
        onClick={!playing ? start : stop}
      >
        {!playing ? "🔥 Start" : "⏸ Pause"}
      </button>

    </div>
  )
}
