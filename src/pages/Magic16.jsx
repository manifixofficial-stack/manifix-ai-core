import { useEffect } from "react";

import {
  Magic16Controls,
  Magic16Timer,
  Magic16Step,
  Magic16Progress,
  Magic16Score,
  Magic16Complete,
  Magic16Share,
  PostureOverlay,
  BreathingCircle
} from "../components";

import { useMagic16, useVoice } from "../hooks";

import logo from "../assets/logo.png";
import "../styles/magic16.css";

export default function Magic16() {

 const {
  steps = [],
    stepIndex = 0,
    stepTime = 0,
    totalTime = 0,
    progress = 0,
    score = 0,
    start,
    stop,
    restart,
    running = false,
    completed = false,
    averageScore = 0,
    streak = 0
  } = useMagic16();

  const { speak } = useVoice();

  // Debug (remove later)
  console.log("Magic16 Steps:", steps);

  // ================= Voice Coach =================
  useEffect(() => {

    if (!running) return;

    const step = steps?.[stepIndex];

    if (step?.text) {
      speak(step.text);
    }

  }, [stepIndex, running, steps, speak]);

  // ================= Completed Screen =================
  if (completed) {
    return (
      <Magic16Complete
        score={averageScore}
        streak={streak}
      >
        <Magic16Share score={averageScore} />
      </Magic16Complete>
    );
  }

  // ================= Current Step =================
  const currentStep = steps?.[stepIndex];

  return (
    <div className="magic16">

      {/* Logo */}
      <img
        src={logo}
        alt="ManifiX Logo"
        className="magic16-logo"
      />

      {/* Camera */}
      <div className="magic16-camera">

        <video
          className="magic16-video"
          autoPlay
          playsInline
          muted
        />

        <PostureOverlay />

      </div>

      {/* Step Card */}
      {currentStep && (
       <Magic16Step
  step={currentStep}
  stepIndex={stepIndex}
  stepTime={stepTime}
  totalSteps={steps.length}
/>
      )}

      {/* Breathing Circle (Meditation phase) */}
      {stepIndex >= 10 && running && (
        <BreathingCircle />
      )}

      {/* Timer */}
      <Magic16Timer
        totalTime={totalTime}
        stepTime={stepTime}
      />

      {/* Progress */}
      <Magic16Progress
        progress={progress}
      />

      {/* Score */}
      {running && (
        <Magic16Score
          score={score}
        />
      )}

      {/* Controls */}
      <Magic16Controls
        running={running}
        onStart={start}
        onPause={stop}
        onRestart={restart}
      />

    </div>
  );
}
