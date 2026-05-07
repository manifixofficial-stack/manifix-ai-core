import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import html2canvas from "html2canvas"
import "../styles/Result.css"

export default function Result() {
  const location = useLocation()
  const cardRef = useRef()
  
  // Data passed from the Magic16.jsx session
  const data = location.state || {
    score: 0,
    accuracy: 0,
    isPro: false,
    video: null,
    streak: 1
  }

  const { score, accuracy, isPro, video, streak } = data
  const [stage, setStage] = useState(0)
  const [globalRank, setGlobalRank] = useState(Math.floor(Math.random() * 500) + 1)

  useEffect(() => {
    // 1. Success Celebration
    confetti({ 
      particleCount: 150, 
      spread: 70, 
      origin: { y: 0.6 },
      colors: ['#00d2ff', '#ff00ea', '#ffffff'] // Matching your logo colors
    })

    // 2. Animated Reveal Sequence
    const timers = [
      setTimeout(() => setStage(1), 800),  // Reveal Accuracy
      setTimeout(() => setStage(2), 1600), // Reveal Global Rank
      setTimeout(() => setStage(3), 2400)  // Reveal Actions & Video
    ]

    return () => timers.forEach(clearTimeout)
  }, [])

  const handleViralShare = async () => {
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0c' })
    const image = canvas.toDataURL("image/png")
    
    // In 2026, we use the Web Share API for high-res cards
    if (navigator.share) {
      const blob = await (await fetch(image)).blob()
      const file = new File([blob], 'discipline.png', { type: 'image/png' })
      try {
        await navigator.share({
          title: "ManifiX AI - Level Unlocked",
          text: `I just hit ${accuracy}% accuracy on Day ${streak}. Most people can't handle this. Can you? #ManifiXAI`,
          files: [file]
        })
      } catch (err) { console.log(err) }
    }
  }

  return (
    <div className="result-container-pro">
      
      {/* BACKGROUND LOGO BLUR (The X Logo floating) */}
      <div className="bg-logo-effect" />

      <AnimatePresence>
        {stage >= 1 && (
          <motion.div 
            ref={cardRef}
            className="main-result-card"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {/* LOGO WATERMARK */}
            <div className="watermark">MANIFIX AI</div>

            <div className="accuracy-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="bg" />
                <motion.circle 
                  cx="50" cy="50" r="45" className="fg" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: accuracy / 100 }}
                  transition={{ duration: 2 }}
                />
              </svg>
              <div className="accuracy-text">
                <h2>{accuracy}%</h2>
                <span>ACCURACY</span>
              </div>
            </div>

            {isPro && (
              <motion.div 
                className="pro-status"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                🏆 DISCIPLINE PRO TIER
              </motion.div>
            )}

            <div className="streak-stats">
              <div className="stat-item">
                <span className="label">STREAK</span>
                <span className="val">{streak} DAYS</span>
              </div>
              <div className="stat-item">
                <span className="label">RANK</span>
                <span className="val">#{globalRank}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIDEO PROOF PREVIEW */}
      {stage >= 3 && video && (
        <motion.div className="video-preview-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>🎥 AI VERIFIED CLIP READY</p>
          <video src={URL.createObjectURL(video)} autoPlay loop muted />
        </motion.div>
      )}

      {/* FINAL ACTIONS */}
      {stage >= 3 && (
        <motion.div className="action-footer" initial={{ y: 100 }} animate={{ y: 0 }}>
          <button className="share-btn-main" onClick={handleViralShare}>
             SHARE PROOF TO X 🔥
          </button>
          <Link to="/magic16" className="next-day-link">
            READY FOR DAY {streak + 1}?
          </Link>
        </motion.div>
      )}

    </div>
  )
}
