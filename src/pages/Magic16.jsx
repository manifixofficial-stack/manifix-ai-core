import { useRef, useEffect, useState, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import confetti from "canvas-confetti";
import "../styles/magic16.css";
import logo from "../assets/logo.png"; 
/* Audio */
import meditationAudio from "../assets/audio/meditation/meditation.mp3";

/* Yoga Images */
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

/* Meditation Images */
import med1 from "../assets/steps/med-01.png";
import med2 from "../assets/steps/med-02.png";
import med3 from "../assets/steps/med-03.png";
import med4 from "../assets/steps/med-04.png";
import med5 from "../assets/steps/med-05.png";
import med6 from "../assets/steps/med-06.png";
import med7 from "../assets/steps/med-07.png";

export default function Magic16() {

  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const meditationRef = useRef(null);

  const timerRef = useRef(null);
  const detectRef = useRef(null);

  const TOTAL_TIME = 960;

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

  const yogaImages = [
    yoga1,yoga2,yoga3,yoga4,
    yoga5,yoga6,yoga71,yoga8
  ];

  const meditationImages = [
    med1,med2,med3,med4,med5,med6,med7
  ];

  const speak = (text)=>{

    if(!window.speechSynthesis) return;

    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);

  };

  const initCamera = async()=>{

    try{

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video:true
        });

      streamRef.current = stream;

      if(videoRef.current){
        videoRef.current.srcObject = stream;
      }

    }catch(e){

      setCameraError(true);

    }

  };

  const initDetector = async()=>{

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

    const start = async()=>{

      await initCamera();
      await initDetector();

      meditationRef.current =
        new Audio(meditationAudio);

      meditationRef.current.loop = true;

      setLoading(false);

    };

    start();

    return ()=>{

      streamRef.current?.getTracks().forEach(t=>t.stop());

      clearInterval(timerRef.current);
      clearInterval(detectRef.current);

    };

  },[]);

  const calculateAngle=(A,B,C)=>{

    const AB={x:A.x-B.x,y:A.y-B.y};
    const CB={x:C.x-B.x,y:C.y-B.y};

    const dot=AB.x*CB.x+AB.y*CB.y;

    const magAB=Math.hypot(AB.x,AB.y);
    const magCB=Math.hypot(CB.x,CB.y);

    const angle=Math.acos(dot/(magAB*magCB));

    return angle*180/Math.PI;

  };

  const detectPose=useCallback(async()=>{

    if(!detectorRef.current) return;

    const poses =
      await detectorRef.current
      .estimatePoses(videoRef.current);

    if(!poses.length) return;

    const kp = poses[0].keypoints;

    const hip = kp.find(k=>k.name==="left_hip");
    const knee = kp.find(k=>k.name==="left_knee");
    const ankle = kp.find(k=>k.name==="left_ankle");

    if(!hip||!knee||!ankle) return;

    const angle =
      calculateAngle(hip,knee,ankle);

    const score =
      Math.max(0,100-Math.abs(angle-90));

    setPostureScore(Math.round(score));

  },[]);

  const startRitual=()=>{

    setPlaying(true);
    setPhase("yoga");

    speak("Welcome to Magic Sixteen. Begin Yoga.");

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

            meditationRef.current.play();

            speak("Now begin meditation.");

          }

          return newT;

        });

      },1000);

  };

  const finishRitual=()=>{

    clearInterval(timerRef.current);
    clearInterval(detectRef.current);

    meditationRef.current.pause();

    setPlaying(false);
    setPhase("complete");

    const energy =
      Math.round(postureScore*0.7 +
      Math.random()*30);

    setEnergyScore(energy);

    confetti({
      particleCount:200,
      spread:90
    });

    updateStreak();

  };

  const updateStreak=()=>{

    const today=new Date().toDateString();

    const last=localStorage.getItem("magic16-last");

    let streak=
      Number(localStorage.getItem("magic16-streak")||0);

    if(last!==today){

      streak++;

      localStorage.setItem("magic16-last",today);
      localStorage.setItem("magic16-streak",streak);

    }

  };

  useEffect(()=>{

    if(phase!=="yoga") return;

    const id=setInterval(()=>{

      setStep(s=>s+1);

    },60000);

    return ()=>clearInterval(id);

  },[phase]);

  const breathingCycle=()=>{

    const states=["inhale","hold","exhale"];

    setBreath(b=>{
      const i=states.indexOf(b);
      return states[(i+1)%3];
    });

  };

  useEffect(()=>{

    if(phase==="meditation"){

      const id=setInterval(breathingCycle,4000);

      return ()=>clearInterval(id);

    }

  },[phase]);

  if(loading)
    return <div className="magic16-loading">Initializing AI Ritual...</div>;

  if(cameraError)
    return <div className="magic16-error">Camera permission required</div>;

  return (

    <div className="magic16-container">

      {phase==="intro" && (

        <div className="magic16-intro">

          <h1>Magic 16</h1>

          <p>8 min Yoga<br/>8 min Meditation</p>

          <button onClick={startRitual}>
            Begin Ritual
          </button>

        </div>

      )}

      {phase==="yoga" && (

        <div className="magic16-yoga">

          <h2>Yoga Session</h2>

          <img
            src={yogaImages[step%yogaImages.length]}
            className="step-image"
          />

          <p>{yogaSteps[step%yogaSteps.length]}</p>

          <h3>Posture Score</h3>

          <h1>{postureScore}%</h1>

        </div>

      )}

      {phase==="meditation" && (

        <div className="magic16-meditation">

          <h2>Meditation</h2>

          <img
            src={meditationImages[step%meditationImages.length]}
            className="step-image"
          />

          <div className={"breathing "+breath}></div>

          <p>{breath.toUpperCase()}</p>

        </div>

      )}

      {phase==="complete" && (

        <div className="magic16-result">

          <h2>Ritual Complete</h2>

          <h1>Energy {energyScore}</h1>

          <p>Posture {postureScore}</p>

          <p>
            Streak 🔥
            {localStorage.getItem("magic16-streak")||1}
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
