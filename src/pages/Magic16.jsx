// src/pages/Magic16.jsx

import { useEffect, useRef, useState, useMemo } from "react"
import { steps } from "../constants/steps"
import confetti from "canvas-confetti"
import "../styles/magic16.css"

export default function Magic16() {

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
  const [completed, setCompleted] = useState(false)

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

  const day = stepIndex + 1
  const current = steps[stepIndex]

  const TOTAL = useMemo(() => {
    return steps.reduce((a, b) => a + b.duration, 0)
  }, [])

  /* ================= SYNC REFS ================= */

  useEffect(() => {
    stepRef.current = stepIndex
    timeRef.current = timeLeft
  }, [stepIndex, timeLeft])

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

    if (type === "motivation") {
      msg.rate = 1
      msg.pitch = 1.2
    } else if (type === "calm") {
      msg.rate = 0.85
      msg.pitch = 0.9
    } else {
      msg.rate = 0.9
      msg.pitch = 1
    }

    if (speechSynthesis.speaking) speechSynthesis.cancel()
    speechSynthesis.speak(msg)
  }

  /* ================= HOOK ================= */

  useEffect(() => {
    if (showHook) {
      speak("You won’t finish this. Most people quit.")
    }
  }, [showHook])

  /* ================= DAILY LOCK ================= */

  useEffect(() => {
    const last = localStorage.getItem("last_done")
    if (!last) return

    const lastDate = new Date(last)
    const today = new Date()

    if (lastDate.toDateString() === today.toDateString()) {
      setCompleted(true)
    }
  }, [])

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

        /* 🔥 Dopamine triggers */
        if (prev === 10) speak("You're still here. That’s rare.")
        if (prev === 5) speak("Most people quit here.")
        if (prev === 2) speak("Finish it.")

        return prev - 1
      })

      /* PROGRESS */
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
    speak("Paused. Come back stronger.")
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

    localStorage.setItem("magic16_streak", streak)
    localStorage.setItem("last_done", new Date().toISOString())

    /* XP SYSTEM */
    setXp(prev => prev + 50)

    /* Identity reinforcement */
    const identities = [
      "You don’t quit.",
      "You are disciplined.",
      "You finish what you start.",
      "You are rare."
    ]

    speak(`Day complete. ${streak} day streak.`)
    setTimeout(() => {
      speak(identities[Math.floor(Math.random() * identities.length)])
    }, 1500)

    setTimeout(() => setCompleted(true), 800)
  }

  /* ================= SHARE ================= */

  const handleShare = async () => {
    const url = window.location.origin

    const text = `🔥 I just completed Day ${day}/16

92% people quit before Day 5.

I'm still going.

Can you beat me? 👇
${url}`

    try {
      if (navigator.share) {
        await navigator.share({ title: "Magic16", text, url })
      } else {
        await navigator.clipboard.writeText(text)
        speak("Copied. Share it now.")
      }
    } catch (e) {
      console.log(e)
    }
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

  if (completed) {
    const streak = Number(localStorage.getItem("magic16_streak") || 0)

    return (
      <div className="complete">
        <h1>🔥 You Didn’t Quit</h1>
        <p>Day {day} complete</p>
        <h2>{streak}-Day Streak</h2>
        <p>XP: {xp}</p>

        <button onClick={handleShare}>📲 Share</button>
        <button onClick={() => window.location.reload()}>
          Continue Tomorrow
        </button>
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
