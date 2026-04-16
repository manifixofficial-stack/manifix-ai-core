import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import html2canvas from "html2canvas"
import "../styles/Result.css"

export default function Result() {

  const location = useLocation()
  const cardRef = useRef()

  const data = location.state || {
    score: 120,
    accuracy: 85,
    time: "16:00",
    xpEarned: 50,
  }

  const { score, accuracy, time, xpEarned } = data

  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)

  const [stage, setStage] = useState(0)
  const [showRank, setShowRank] = useState(false)
  const [caption, setCaption] = useState("")

  /* ================= LOAD ================= */
  useEffect(() => {
    const s = Number(localStorage.getItem("magic16_streak") || 0)
    const x = Number(localStorage.getItem("magic16_xp") || 0)
    const l = Number(localStorage.getItem("magic16_level") || 1)

    setStreak(s)
    setXp(x)
    setLevel(l)

    /* 🔥 story animation sequence */
    const sequence = [
      () => confetti({ particleCount: 80, spread: 70 }),
      () => setStage(1),
      () => setStage(2),
      () => setStage(3),
      () => setShowRank(true),
    ]

    sequence.forEach((fn, i) => {
      setTimeout(fn, i * 900)
    })

  }, [])

  /* ================= VIRAL CAPTION ================= */
  useEffect(() => {
    const captions = [
      `🔥 Day ${streak}/16 completed. I didn’t quit.`,
      `💪 Most people stop at Day 3. I’m at Day ${streak}.`,
      `⚡ Discipline level increasing… Day ${streak}/16`,
      `🧠 Rewiring my life with AI. Day ${streak}/16`
    ]

    setCaption(captions[Math.floor(Math.random() * captions.length)])
  }, [streak])

  /* ================= SHARE ================= */
  const handleShare = async () => {

    const canvas = await html2canvas(cardRef.current)
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"))

    if (!blob) return

    const file = new File([blob], "magic16.png", { type: "image/png" })

    const text = `${caption}

92% people quit before Day 5.
I’m not one of them.

Can you do it? 🔥`

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Magic16 Result",
          text
        })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch (e) {}
  }

  /* ================= UI STAGES ================= */

  return (
    <div className="result">

      {/* 🔥 STAGE 0 */}
      {stage === 0 && (
        <motion.div className="loading-stage">
          <h1>Analyzing Performance...</h1>
        </motion.div>
      )}

      {/* ⚡ STAGE 1 */}
      {stage >= 1 && (
        <motion.div className="result-card" ref={cardRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >

          <h1>🎬 Session Complete</h1>

          {/* STREAK */}
          <motion.div className="big-number">
            🔥 {streak} Day Streak
          </motion.div>

          {/* SCORE */}
          <div className="stats">
            <p>⚡ Score: {score}</p>
            <p>🎯 Accuracy: {accuracy}%</p>
            <p>⏱ Time: {time}</p>
            <p>💎 XP +{xpEarned}</p>
          </div>

        </motion.div>
      )}

      {/* 🧠 STAGE 2 */}
      {stage >= 2 && (
        <motion.div className="identity">
          <h2>You are becoming different.</h2>
          <p>Most users quit. You are not most users.</p>
        </motion.div>
      )}

      {/* 📊 STAGE 3 */}
      {stage >= 3 && (
        <motion.div className="rank-card">

          <h3>📊 Performance Rank</h3>

          <div className="rank">
            Top {Math.max(5, 100 - streak * 4)}% Performer
          </div>

          <p className="note">
            (Based on internal challenge data)
          </p>

        </motion.div>
      )}

      {/* 💥 ACTIONS */}
      {stage >= 3 && (
        <div className="actions">

          <button onClick={handleShare}>
            📲 Share Result
          </button>

          <Link to="/app/magic16">
            🚀 Start Next Day
          </Link>

        </div>
      )}

    </div>
  )
}
