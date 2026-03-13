// src/pages/Magic16.jsx
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
    steps,
    stepIndex,
    stepTime,
    totalTime,
    progress,
    score,
    start,
    pause,
    resume,
    restart,
    running,
    paused,
    completed,
    averageScore,
    streak
  } = useMagic16();

  const { speak } = useVoice();

  useEffect(() => {
    if (!running) return;
    const step = steps?.[stepIndex];
    if (step?.text) speak(step.text);
  }, [stepIndex, running, steps, speak]);

  if (completed) {
    return (
      <Magic16Complete score={averageScore} streak={streak}>
        <Magic16Share score={averageScore} />
      </Magic16Complete>
    );
  }

  const currentStep = steps?.[stepIndex];

  return (
    <div className="magic16">
      {/* Logo */}
      <img src={logo} alt="ManifiX Logo" className="magic16-logo" />

      {/* Camera */}
      <div className="magic16-camera">
        <video className="magic16-video" autoPlay playsInline muted />
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

      {/* Breathing Circle */}
      {stepIndex >= 10 && running && <BreathingCircle />}

      {/* Timer */}
      <Magic16Timer totalTime={totalTime} stepTime={stepTime} />

      {/* Progress */}
      <Magic16Progress progress={progress} />

      {/* Score */}
      {running && <Magic16Score score={score} />}

      {/* Controls */}
      <Magic16Controls
        running={running}
        paused={paused}
        completed={completed}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onRestart={restart}
      />
    </div>
  );
}
