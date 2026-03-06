import { useRef, useEffect, useState, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import confetti from "canvas-confetti";
import "../styles/magic16.css";

/*
Magic16 Ritual

8 minutes Yoga
8 minutes Meditation
= 16 minute ritual

Features
- AI pose detection
- voice coach
- breathing circle
- posture scoring
- energy score
- streak system
*/

export default function Magic16() {

  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const detectRef = useRef(null);

  const TOTAL_TIME = 960; // 16 minutes

  const [phase,setPhase] = useState("intro");
  const [time,setTime] = useState(TOTAL_TIME);
  const [step,setStep] = useState(0);
  const [postureScore,setPostureScore] = useState(0);
  const [energyScore,setEnergyScore] = useState(0);
  const [breath,setBreath] = useState("inhale");
  const [playing,setPlaying] = useState(false);
  const [loading,setLoading] = useState(true);
  const [cameraError,setCameraError] = useState(false);

  const yogaSteps = [
    "Mountain Pose",
    "Forward Fold",
    "Half Lift",
    "Plank Pose",
    "Cobra Pose",
    "Downward Dog",
    "Warrior Pose",
    "Tree Pose"
  ];

  const meditationSteps = [
    "Focus on breath",
    "Release tension",
    "Observe thoughts",
    "Stay present",
    "Visualize calm",
    "Deep breathing",
    "Feel gratitude",
    "Inner silence"
  ];

  const speak = (text) => {

    if(!window.speechSynthesis) return;

    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);

  };

  const initCamera = async () => {

    try{

      const stream = await navigator.mediaDevices.getUserMedia({
        video:true
      });

      streamRef.current = stream;

      if(videoRef.current){
        videoRef.current.srcObject = stream;
      }

    }catch(err){

      console.error(err);
      setCameraError(true);

    }

  };

  const initDetector = async () => {

    await tf.ready();
    await tf.setBackend("webgl");

    detectorRef.current =
      await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        {
          modelType:
          posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        }
      );

  };

  useEffect(()=>{

    const start = async () => {

      try{

        await initCamera();
        await initDetector();

        setLoading(false);

      }catch(e){

        console.error(e);

      }

    };

    start();

    return ()=>{

      if(streamRef.current){

        streamRef.current
          .getTracks()
          .forEach(t=>t.stop());

      }

      clearInterval(timerRef.current);
      clearInterval(detectRef.current);

    };

  },[]);

  const calculateAngle = (A,B,C)=>{

    const AB = {
      x:A.x-B.x,
      y:A.y-B.y
    };

    const CB = {
      x:C.x-B.x,
      y:C.y-B.y
    };

    const dot =
      AB.x*CB.x +
      AB.y*CB.y;

    const magAB =
      Math.hypot(AB.x,AB.y);

    const magCB =
      Math.hypot(CB.x,CB.y);

    const angle =
      Math.acos(dot/(magAB*magCB));

    return angle * 180 / Math.PI;

  };

  const detectPose = useCallback(async()=>{

    if(!detectorRef.current) return;

    const poses =
      await detectorRef.current
        .estimatePoses(videoRef.current);

    if(!poses.length) return;

    const kp = poses[0].keypoints;

    const hip = kp.find(k=>k.name==="left_hip");
    const knee = kp.find(k=>k.name==="left_knee");
    const ankle = kp.find(k=>k.name==="left_ankle");

    if(!hip || !knee || !ankle) return;

    const a =
      calculateAngle(hip,knee,ankle);

    const score =
      Math.max(0,
      100 - Math.abs(a-90));

    setPostureScore(
      Math.round(score)
    );

  },[]);

  const startRitual = ()=>{

    if(playing) return;

    setPlaying(true);
    setPhase("yoga");

    speak(
      "Welcome to Magic sixteen. Let's begin with yoga."
    );

    detectRef.current =
      setInterval(detectPose,500);

    timerRef.current =
      setInterval(()=>{

        setTime(t=>{

          if(t<=0){

            finishRitual();
            return 0;

          }

          const newT = t-1;

          if(newT===480){

            setPhase("meditation");

            speak(
             "Great work. Now begin meditation."
            );

          }

          return newT;

        });

      },1000);

  };

  const finishRitual = ()=>{

    clearInterval(timerRef.current);
    clearInterval(detectRef.current);

    setPlaying(false);
    setPhase("complete");

    const focus =
      80 + Math.random()*10;

    const energy =
      Math.round(
        postureScore*0.5 +
        focus*0.5
      );

    setEnergyScore(energy);

    confetti({
      particleCount:200,
      spread:90
    });

    speak(
      "Beautiful session. Your energy is rising."
    );

    updateStreak();

  };

  const updateStreak = ()=>{

    const today =
      new Date().toDateString();

    const last =
      localStorage.getItem(
        "magic16-last"
      );

    let streak =
      Number(
        localStorage.getItem(
          "magic16-streak"
        )||0
      );

    if(last!==today){

      streak++;

      localStorage.setItem(
        "magic16-last",
        today
      );

      localStorage.setItem(
        "magic16-streak",
        streak
      );

    }

  };

  const breathingCycle = ()=>{

    const states =
      ["inhale","hold","exhale"];

    setBreath(b=>{

      const i =
        states.indexOf(b);

      return states[
        (i+1)%3
      ];

    });

  };

  useEffect(()=>{

    if(phase==="meditation"){

      const id =
        setInterval(
          breathingCycle,
          4000
        );

      return ()=>clearInterval(id);

    }

  },[phase]);

  if(loading)
    return(
      <div className="magic16-loading">
        Initializing AI Ritual...
      </div>
    );

  if(cameraError)
    return(
      <div className="magic16-error">
        Camera permission required
      </div>
    );

  return (

    <div className="magic16-container">

      {phase==="intro" && (

        <div className="magic16-intro">

          <h1>Magic 16</h1>

          <p>
          8 minutes yoga
          <br/>
          8 minutes meditation
          </p>

          <button
          onClick={startRitual}
          >
          Begin Ritual
          </button>

        </div>

      )}

      {phase==="yoga" && (

        <div className="magic16-yoga">

          <h2>
          Yoga Session
          </h2>

          <p>
          Step: {yogaSteps[
            step %
            yogaSteps.length
          ]}
          </p>

          <div className="score">

            Posture Score

            <h1>
            {postureScore}%
            </h1>

          </div>

        </div>

      )}

      {phase==="meditation" && (

        <div className="magic16-meditation">

          <h2>Meditation</h2>

          <div
          className={
            "breathing-circle "+
            breath
          }
          />

          <p>
          {breath.toUpperCase()}
          </p>

        </div>

      )}

      {phase==="complete" && (

        <div className="magic16-result">

          <h2>
          Ritual Complete
          </h2>

          <h1>
          Energy {energyScore}
          </h1>

          <p>
          Posture {postureScore}
          </p>

          <p>
          Streak 🔥
          {
            localStorage.getItem(
              "magic16-streak"
            ) || 1
          }
          </p>

        </div>

      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera"
      />

    </div>

  );

}
