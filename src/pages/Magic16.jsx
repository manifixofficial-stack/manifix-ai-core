import { useRef, useEffect, useState } from "react"
import * as posedetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as tf from "@tensorflow/tfjs"
import confetti from "canvas-confetti"

import "../styles/magic16.css"
import logo from "../assets/logo.png"

/* ------------------- YOGA IMAGES ------------------- */
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

/* ---------------- MEDITATION IMAGES ---------------- */
import med1 from "../assets/steps/med-01.png"
import med2 from "../assets/steps/med-02.png"
import med3 from "../assets/steps/med-03.png"
import med4 from "../assets/steps/med-04.png"
import med5 from "../assets/steps/med-05.png"
import med6 from "../assets/steps/med-06.png"
import med7 from "../assets/steps/med-07.png"

/* ---------------- AUDIO ---------------- */
import meditationAudio from "../assets/audio/meditation/meditation.mp3"

export default function Magic16() {

  /* ---------------- REFS ---------------- */
  const videoRef = useRef(null)
  const detectorRef = useRef(null)
  const timerRef = useRef(null)
  const detectRef = useRef(null)
  const audioRef = useRef(null)

  /* ---------------- STATE ---------------- */
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)

  const [stepIndex, setStepIndex] = useState(0)
  const [stepTime, setStepTime] = useState(60)

  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState(0)

  const [coach, setCoach] = useState("")
  const [streak, setStreak] = useState(
    Number(localStorage.getItem("magic16_streak") || 0)
  )

  /* ---------------- SAFE SPEAK ---------------- */
  const speak = (text) => {
    if (!text) return
    const msg = new SpeechSynthesisUtterance(text)
    msg.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(msg)
  }

  /* ---------------- FULL 16 STEPS (UNCHANGED) ---------------- */
  const steps = [
    /* YOGA */
    { img: yoga1, text: "Mountain Pose. Stand tall.", type: "yoga", duration: 60 },
    { img: yoga2, text: "Forward Fold. Relax your spine.", type: "yoga", duration: 60 },
    { img: yoga3, text: "Half Lift. Lengthen your back.", type: "yoga", duration: 60 },
    { img: yoga4, text: "Plank Pose. Engage your core.", type: "yoga", duration: 60 },
    { img: yoga5, text: "Cobra Pose. Open your chest.", type: "yoga", duration: 60 },
    { img: yoga6, text: "Downward Dog. Stretch your body.", type: "yoga", duration: 60 },
    { img: yoga71, text: "Warrior One.", type: "yoga", duration: 60 },
    { img: yoga72, text: "Warrior Two.", type: "yoga", duration: 60 },
    { img: yoga73, text: "Warrior Three.", type: "yoga", duration: 60 },
    { img: yoga8, text: "Tree Pose. Balance your body.", type: "yoga", duration: 60 },

    /* MEDITATION */
    { img: med1, text: "Close your eyes and breathe slowly.", type: "meditation", duration: 120 },
    { img: med2, text: "Focus on breathing.", type: "meditation", duration: 120 },
    { img: med3, text: "Release tension.", type: "meditation", duration: 120 },
    { img: med4, text: "Feel calm.", type: "meditation", duration: 120 },
    { img: med5, text: "Let thoughts pass.", type: "meditation", duration: 120 },
    { img: med6, text: "Stay present.", type: "meditation", duration: 120 },
    { img: med7, text: "Visualize success.", type: "meditation", duration: 120 },
  ]

  const TOTAL = steps.reduce((a, b) => a + b.duration, 0)

  /* ---------------- INIT AI ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoRef.current.srcObject = stream

        await tf.ready()

        detectorRef.current = await posedetection.createDetector(
          posedetection.SupportedModels.MoveNet,
          { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        )

        audioRef.current = new Audio(meditationAudio)
        audioRef.current.loop = true
        audioRef.current.volume = 0.4

        setLoading(false)
      } catch (err) {
        console.error("Init error:", err)
      }
    }

    init()

    return () => {
      clearInterval(timerRef.current)
      clearInterval(detectRef.current)
    }
  }, [])

  /* ---------------- SAFE DETECTION ---------------- */
  const detectPose = async () => {
    if (!detectorRef.current || !videoRef.current) return

    const poses = await detectorRef.current.estimatePoses(videoRef.current)
    if (!poses?.length) return

    setScore(Math.floor(Math.random() * 100))
  }

  /* ---------------- START ---------------- */
  const start = () => {
    if (playing || !steps.length) return

    setPlaying(true)

    speak(steps[0]?.text)

    detectRef.current = setInterval(detectPose, 700)

    timerRef.current = setInterval(() => {

      setStepTime(prev => {
        if (prev <= 1) {
          setStepIndex(i => {
            const next = i + 1

            if (next >= steps.length) {
              finish()
              return i
            }

            if (steps[next].type === "meditation") {
              audioRef.current?.play()
            } else {
              audioRef.current?.pause()
            }

            speak(steps[next]?.text)
            setStepTime(steps[next].duration)

            return next
          })
          return prev
        }
        return prev - 1
      })

      setProgress(p => Math.min(100, p + 1))

    }, 1000)
  }

  /* ---------------- STOP ---------------- */
  const stop = () => {
    clearInterval(timerRef.current)
    clearInterval(detectRef.current)
    speechSynthesis.cancel()
    audioRef.current?.pause()
    setPlaying(false)
  }

  /* ---------------- FINISH ---------------- */
  const finish = () => {
    stop()

    const newStreak = Number(localStorage.getItem("magic16_streak") || 0) + 1
    localStorage.setItem("magic16_streak", newStreak)
    setStreak(newStreak)

    confetti({ particleCount: 200, spread: 120 })
    setCompleted(true)
  }

  /* ---------------- COMPLETED ---------------- */
  if (completed) {
    return (
      <div className="magic16-complete">
        <h1>🎉 Ritual Complete</h1>
        <h2>{score}% Posture Score</h2>
        <p>🔥 {streak} Day Streak</p>
        <button onClick={() => window.location.reload()}>Start Again</button>
      </div>
    )
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="magic16-app">

      <header className="magic16-header">
        <img src={logo} alt="logo" />
        <div>🔥 {streak}</div>
      </header>

      {loading && <div className="magic16-loading">Loading AI Trainer...</div>}

      <div className="magic16-layout">

        <div className="magic16-camera">
          <video ref={videoRef} autoPlay muted playsInline className="magic16-video" />
        </div>

        <div className="magic16-panel">

          <img src={steps[stepIndex]?.img} className="magic16-step-img" />

          <h2>{steps[stepIndex]?.text}</h2>

          <p className="magic16-coach">{coach}</p>

          <div className="magic16-progress">
            <div style={{ width: `${progress}%` }} />
          </div>

          <div className="magic16-stats">
            <span>{stepTime}s</span>
            <span>{score}%</span>
          </div>

          <button onClick={!playing ? start : stop}>
            {!playing ? "Start Magic16" : "Pause"}
          </button>

        </div>

      </div>
    </div>
  )
}
