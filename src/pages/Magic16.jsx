import { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getSessionSteps } from "../constants/steps"
import confetti from "canvas-confetti"
import "../styles/magic16.css"

export default function Magic16() {
  const navigate = useNavigate()

  /* ================= SAFE DAY ================= */
  const day = Number(localStorage.getItem("magic16_streak") || 1)

  /* ================= SAFE STEPS ================= */
  const sessionSteps = useMemo(() => {
    const data = getSessionSteps(day)

    if (Array.isArray(data) && data.length > 0) return data

    // ✅ fallback (prevents blank screen)
    return [
      {
        name: "Breathing",
        duration: 10,
        guidance: "Breathe slowly and stay focused",
        image: "/assets/steps/yoga/1.jpg"
      },
      {
        name: "Hold Pose",
        duration: 10,
        guidance: "Hold steady. Don't move.",
        image: "/assets/steps/med/1.jpg"
      }
    ]
  }, [day])

  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(sessionSteps[0]?.duration || 10)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)

  const [xp, setXp] = useState(Number(localStorage.getItem("m16_xp") || 0))
  const [showHook, setShowHook] = useState(!localStorage.getItem("m16_started"))

  const stepRef = useRef(0)
  const timeRef = useRef(0)
  const timerRef = useRef(null)

  const TOTAL = useMemo(() => {
    return sessionSteps.reduce((a, b) => a + (b?.duration || 0), 0)
  }, [sessionSteps])

  const current = sessionSteps[stepIndex]

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

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const next = stepRef.current + 1

          confetti({ particleCount: 30, spread: 50 })

          setXp(p => p + 5)

          if (next >= sessionSteps.length) {
            finish()
            return 0
          }

          setStepIndex(next)
          return sessionSteps[next]?.duration || 10
        }

        return prev - 1
      })

      /* PROGRESS */
      setProgress(() => {
        const done = sessionSteps
          .slice(0, stepRef.current)
          .reduce((a, b) => a + (b?.duration || 0), 0)

        const currentDone =
          (sessionSteps[stepRef.current]?.duration || 0) - timeRef.current

        return TOTAL > 0
          ? Math.floor(((done + currentDone) / TOTAL) * 100)
          : 0
      })

    }, 1000)
  }

  /* ================= STOP ================= */
  const stop = () => {
    clearInterval(timerRef.current)
    timerRef.current = null
    setPlaying(false)
  }

  /* ================= FINISH ================= */
  const finish = () => {
    stop()

    confetti({ particleCount: 200, spread: 100 })

    const streak = Number(localStorage.getItem("magic16_streak") || 0) + 1
    localStorage.setItem("magic16_streak", streak)

    setTimeout(() => {
      navigate("/result", {
        state: {
          score: streak * 10,
          completed: true
        }
      })
    }, 1000)
  }

  /* ================= HOOK ================= */
  useEffect(() => {
    if (showHook) {
      const t = setTimeout(() => start(), 1200)
      return () => clearTimeout(t)
    }
  }, [showHook])

  /* ================= SAFETY UI ================= */
  if (!current) {
    return <h2 style={{ color: "white" }}>Loading steps... ❌</h2>
  }

  /* ================= UI ================= */
  return (
    <div className="magic16">

      <div className="top">
        <h3>🔥 Day {day}</h3>
        <p>XP: {xp}</p>
      </div>

      <img
        src={current.image || "/assets/steps/yoga/1.jpg"}
        alt=""
        className="image"
      />

      <h2>{current.name}</h2>
      <p>{current.guidance}</p>

      <div className="timer">
        <h1>{timeLeft}</h1>
      </div>

      <div className="progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      <button onClick={playing ? stop : start}>
        {playing ? "Pause" : "Start"}
      </button>

    </div>
  )
}
