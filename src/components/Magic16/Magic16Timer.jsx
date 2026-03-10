import React from "react";

const Magic16Timer = ({ totalTime = 0, stepTime = 0 }) => {

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2,"0")}`
  }

  return (

    <div className="magic16-timer">

      <div className="magic16-time-block">
        <span className="magic16-label">Session</span>
        <span className="magic16-time">
          {formatTime(totalTime)}
        </span>
      </div>

      <div className="magic16-time-block">
        <span className="magic16-label">Step</span>
        <span className="magic16-time">
          {formatTime(stepTime)}
        </span>
      </div>

    </div>

  )
}

export default Magic16Timer
