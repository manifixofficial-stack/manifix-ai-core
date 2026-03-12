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
    stop,
    restart,
    running,
    completed,
    averageScore,
    streak
  } = useMagic16();

  const { speak } = useVoice();

  // Voice guidance when step changes
  useEffect(() => {

    if (!running) return;

    if (steps?.length && steps[stepIndex]) {
      speak(steps[stepIndex].text);
    }

  }, [stepIndex, running, steps, speak]);

  // Completed screen
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

      {/* Step display */}
      {steps?.length > 0 && (
        <Magic16Step
          step={steps[stepIndex]}
          stepIndex={stepIndex}
        />
      )}

      {/* Meditation breathing */}
      {stepIndex >= 10 && (
        <BreathingCircle />
      )}

      {/* Timers */}
      <Magic16Timer
        totalTime={totalTime}
        stepTime={stepTime}
      />

      {/* Progress */}
      <Magic16Progress progress={progress} />

      {/* Score */}
      {running && (
        <Magic16Score score={score} />
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
