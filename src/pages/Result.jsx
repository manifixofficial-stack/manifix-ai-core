// src/pages/Result.jsx

import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import html2canvas from "html2canvas"
import "../styles/Result.css"

export default function Result() {

  const location = useLocation()
  const cardRef = useRef()

  /* ================= DATA FROM MAGIC16 ================= */

  const data = location.state || {
    score: 120,
    accuracy: 85,
    time: "16:00",
    xpEarned: 50,
  }

  const { score, accuracy, time, xpEarned } = data

  /* ================= GLOBAL STATE (READ ONLY) ================= */

  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)

  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    const s = Number(localStorage.getItem("magic16_streak") || 0)
    const x = Number(localStorage.getItem("magic16_xp") || 0)
    const l = Number(localStorage.getItem("magic16_level") || 1)

    setStreak(s)
    setXp(x)
    setLevel(l)

    /* 🎉 Confetti burst */
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
    })

    /* 🔥 Fake level up animation trigger (visual only) */
    if (xpEarned >= 50) {
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 2500)
    }

  }, [xpEarned])

  /* ================= FEEDBACK ================= */

  const getFeedback = () => {
    if (accuracy >= 90) return "🔥 Elite. Almost no one reaches this."
    if (accuracy >= 75) return "💪 Strong. You're ahead of most."
    if (accuracy >= 60) return "👍 Good. But you can push harder."
    return "⚡ This is where most quit. Don't."
  }

  /* ================= SHARE ================= */

  const handleShare = async () => {
    const canvas = await html2canvas(cardRef.current)
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"))

    if (!blob) return

    const file = new File([blob], "magic16-result.png", { type: "image/png" })

    const text = `🔥 ${streak}-Day Streak

I just completed Magic16.

Most people quit before Day 5.

I didn’t.

Can you? 👇`

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Magic16 Result",
          text,
        })
      } else {
        await navigator.clipboard.writeText(text)
        alert("Copied! Share it 🔥")
      }
    } catch (err) {
      console.log(err)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="result">

      {/* 🔥 LEVEL UP POPUP */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="level-up"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            🆙 LEVEL UP
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎉 RESULT CARD */}
      <motion.div
        ref={cardRef}
        className="result-card"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >

        {/* TITLE */}
        <motion.h1
          className="title"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          🎉 You Didn’t Quit
        </motion.h1>

        {/* STREAK */}
        <motion.h2
          className="streak glow"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          🔥 {streak} Day Streak
        </motion.h2>

        {/* SCORE */}
        <motion.div
          className="score"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>{score} XP</h2>
          <p>+{xpEarned} XP gained</p>
        </motion.div>

        {/* XP BAR */}
        <div className="xp-bar">
          <motion.div
            className="xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${xp}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        <p className="level">Level {level}</p>

        {/* STATS */}
        <div className="stats">

          <motion.div whileHover={{ scale: 1.05 }}>
            <h3>🎯 Accuracy</h3>
            <p>{accuracy}%</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }}>
            <h3>⏱ Time</h3>
            <p>{time}</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }}>
            <h3>🔥 Streak</h3>
            <p>{streak}</p>
          </motion.div>

        </div>

        {/* FEEDBACK */}
        <motion.div
          className="feedback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {getFeedback()}
        </motion.div>

      </motion.div>

      {/* ACTIONS */}
      <div className="actions">

        <motion.button
          className="share-btn"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleShare}
        >
          📲 Share Result
        </motion.button>

        <Link to="/app/session" className="retry">
          🔁 Try Again
        </Link>

        <Link to="/app/dashboard" className="dashboard-btn">
          📊 Dashboard
        </Link>

      </div>

    </div>
  )
}
