import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/magic16.css";

import logo from "../../assets/logo.png";
import meditationAudio from "../assets/audio/meditation/meditation.mp3";

import {
  Magic16Controls,
  Magic16Timer,
  Magic16Step,
  Magic16Progress,
  Magic16Score,
  Magic16Complete,
  Magic16Share,
  BreathingCircle,
  PostureOverlay
} from "../components/Magic16";

import { useMagic16 } from "../hooks";

/* =========================
   STEP IMAGES
========================= */

import yoga1 from "../assets/steps/yoga-01.png";
import yoga2 from "../assets/steps/yoga-02.png";
import yoga3 from "../assets/steps/yoga-03.png";
import yoga4 from "../assets/steps/yoga-04.png";
import yoga5 from "../assets/steps/yoga-05.png";
import yoga6 from "../assets/steps/yoga-06.png";
import yoga71 from "../assets/steps/yoga-07-1.png";
import yoga72 from "../assets/steps/yoga-07-2.png";
import yoga73 from "../assets/steps/yoga-07-3.png";
import yoga8 from "../assets/steps/yoga-08.png";

import med1 from "../assets/steps/med-01.png";
import med2 from "../assets/steps/med-02.png";
import med3 from "../assets/steps/med-03.png";
import med4 from "../assets/steps/med-04.png";
import med5 from "../assets/steps/med-05.png";
import med6 from "../assets/steps/med-06.png";
import med7 from "../assets/steps/med-07.png";

/* =========================
   MAGIC16 PAGE
========================= */

export default function Magic16() {

  const videoRef = useRef(null)
  const audioRef = useRef(null)

  /* =========================
     YOGA STEPS (8 minutes)
  ========================= */

  const yogaSteps = [
    { img: yoga1, text: "Mountain Pose. Stand tall and breathe deeply.", duration: 60 },
    { img: yoga2, text: "Forward Fold. Relax your neck.", duration: 40 },
    { img: yoga3, text: "Half Lift. Lengthen your spine.", duration: 40 },
    { img: yoga4, text: "Plank Pose. Engage your core.", duration: 60 },
    { img: yoga5, text: "Cobra Pose. Open your chest.", duration: 40 },
    { img: yoga6, text: "Downward Dog. Stretch fully.", duration: 60 },
    { img: yoga71, text: "Warrior Pose 1. Strong stance.", duration: 40 },
    { img: yoga72, text: "Warrior Pose 2. Focus stability.", duration: 40 },
    { img: yoga73, text: "Warrior Pose 3. Balance.", duration: 40 },
    { img: yoga8, text: "Tree Pose. Deep focus.", duration: 60 }
  ]

  /* =========================
     MEDITATION STEPS (8 minutes)
  ========================= */

  const meditationSteps = [
    { img: med1, text: "Close your eyes and breathe slowly.", duration: 60 },
    { img: med2, text: "Focus on your breath.", duration: 60 },
    { img: med3, text: "Release tension.", duration: 120 },
    { img: med4, text: "Feel calm energy.", duration: 60 },
    { img: med5, text: "Let thoughts pass.", duration: 60 },
    { img: med6, text: "Stay present.", duration: 60 },
    { img: med7, text: "Visualize success.", duration: 60 }
  ]

  const steps = [...yogaSteps, ...meditationSteps]

  /* =========================
     MAGIC16 HOOK
  ========================= */

  const {
    start,
    stop,
    restart,
    progress,
    score,
    stepIndex,
    stepTime,
    totalTime,
    completed,
    averageScore,
    streak
  } = useMagic16(steps)

  const currentStep = steps[stepIndex]

  const isMeditation = stepIndex >= yogaSteps.length

  /* =========================
     AUDIO CONTROL
  ========================= */

  const startMeditationAudio = () => {

    if (!isMeditation) return

    const audio = new Audio(meditationAudio)

    audio.loop = true
    audio.volume = 0.4
    audio.play().catch(()=>{})

    audioRef.current = audio
  }

  /* =========================
     UI
  ========================= */

  return (

    <div className="magic16">

      {/* LOGO */}

      <img src={logo} className="magic16-logo" alt="ManifiX" />

      {/* CAMERA + AI POSTURE */}

      <div className="magic16-camera">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="magic16-video"
        />

        <PostureOverlay />

      </div>

      {/* STEP AREA */}

      <AnimatePresence mode="wait">

        {!completed ? (

          <motion.div
            key={stepIndex}
            className="magic16-step-container"
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-20 }}
          >

            <Magic16Step
              stepIndex={stepIndex}
              step={currentStep}
              stepTime={stepTime}
              totalSteps={steps.length}
            />

            {/* Step Image */}

            <img
              src={currentStep.img}
              alt="pose"
              className="magic16-step-img"
            />

            {/* Breathing Animation during meditation */}

            {isMeditation && <BreathingCircle />}

          </motion.div>

        ) : (

          <Magic16Complete
            averageScore={averageScore}
            streak={streak}
            onRestart={restart}
          />

        )}

      </AnimatePresence>

      {/* TIMER */}

      {!completed && (

        <Magic16Timer
          totalTime={totalTime}
          stepTime={stepTime}
        />

      )}

      {/* PROGRESS */}

      {!completed && (

        <Magic16Progress
          progress={progress}
          totalTime={totalTime}
          stepTime={stepTime}
        />

      )}

      {/* POSTURE SCORE */}

      {!completed && stepIndex < yogaSteps.length && (

        <Magic16Score score={score} />

      )}

      {/* CONTROLS */}

      {!completed && (

        <Magic16Controls
          start={start}
          stop={stop}
        />

      )}

      {/* SHARE AFTER COMPLETE */}

      {completed && (

        <Magic16Share
          averageScore={averageScore}
          streak={streak}
        />

      )}

    </div>

  )

}
