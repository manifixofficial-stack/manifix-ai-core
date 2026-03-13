// src/pages/Magic16.jsx

import { useRef, useEffect, useState, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import confetti from "canvas-confetti";

import "../styles/magic16.css";
import logo from "../../assets/logo.png";

import PostureOverlay from "../components/Magic16/PostureOverlay";
import BreathingCircle from "../components/Magic16/BreathingCircle";

import meditationAudio from "../assets/audio/meditation/meditation.mp3";

// Yoga images
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

// Meditation images
import med1 from "../assets/steps/med-01.png";
import med2 from "../assets/steps/med-02.png";
import med3 from "../assets/steps/med-03.png";
import med4 from "../assets/steps/med-04.png";
import med5 from "../assets/steps/med-05.png";
import med6 from "../assets/steps/med-06.png";
import med7 from "../assets/steps/med-07.png";

export default function Magic16() {

const videoRef = useRef(null);
const streamRef = useRef(null);
const detectorRef = useRef(null);
const timerRef = useRef(null);
const detectRef = useRef(null);
const audioRef = useRef(null);

const [loading,setLoading] = useState(true);
const [playing,setPlaying] = useState(false);
const [completed,setCompleted] = useState(false);

const [score,setScore] = useState(0);
const [progress,setProgress] = useState(0);

const [stepIndex,setStepIndex] = useState(0);
const [stepTime,setStepTime] = useState(60);

const [streak,setStreak] = useState(
Number(localStorage.getItem("magic16_streak") || 0)
);

const [coach,setCoach] = useState("");
const [level,setLevel] = useState("Beginner");

/* ---------- STEPS ---------- */

const yogaSteps = [

{img:yoga1,text:"Mountain Pose. Stand tall.",duration:60},
{img:yoga2,text:"Forward Fold. Relax.",duration:40},
{img:yoga3,text:"Half Lift.",duration:40},
{img:yoga4,text:"Plank Pose.",duration:60},
{img:yoga5,text:"Cobra Pose.",duration:40},
{img:yoga6,text:"Downward Dog.",duration:60},
{img:yoga71,text:"Warrior Pose 1.",duration:40},
{img:yoga72,text:"Warrior Pose 2.",duration:40},
{img:yoga73,text:"Warrior Pose 3.",duration:40},
{img:yoga8,text:"Tree Pose.",duration:60},

];

const meditationSteps = [

{img:med1,text:"Close eyes and breathe.",duration:60},
{img:med2,text:"Focus on breath.",duration:60},
{img:med3,text:"Release tension.",duration:120},
{img:med4,text:"Feel calm.",duration:60},
{img:med5,text:"Let thoughts pass.",duration:60},
{img:med6,text:"Stay present.",duration:60},
{img:med7,text:"Visualize success.",duration:60},

];

const steps=[...yogaSteps,...meditationSteps];

const TOTAL_DURATION = steps.reduce((s,x)=>s+x.duration,0);

const [totalTime,setTotalTime]=useState(TOTAL_DURATION);

/* ---------- CAMERA INIT ---------- */

useEffect(()=>{

const init=async()=>{

const stream = await navigator.mediaDevices.getUserMedia({video:true});
streamRef.current = stream;

videoRef.current.srcObject = stream;

await tf.ready();
await tf.setBackend("webgl");

detectorRef.current = await posedetection.createDetector(
posedetection.SupportedModels.MoveNet,
{modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING}
);

setLoading(false);

};

init();

return ()=>{

streamRef.current?.getTracks().forEach(t=>t.stop());

clearInterval(timerRef.current);
clearInterval(detectRef.current);

};

},[]);

/* ---------- POSE DETECTION ---------- */

const detect = useCallback(async()=>{

if(!detectorRef.current) return;

const poses = await detectorRef.current.estimatePoses(videoRef.current);

if(!poses?.length) return;

const kp = poses[0].keypoints;

const hip = kp.find(k=>k.name==="left_hip");
const knee = kp.find(k=>k.name==="left_knee");
const ankle = kp.find(k=>k.name==="left_ankle");

if(hip && knee && ankle){

const angle = Math.abs(
Math.atan2(ankle.y-knee.y,ankle.x-knee.x) -
Math.atan2(hip.y-knee.y,hip.x-knee.x)
)*180/Math.PI;

const sc = Math.max(0,100-Math.abs(angle-90));

setScore(Math.round(sc));

}

},[]);

/* ---------- SESSION START ---------- */

const start=()=>{

if(playing) return;

setPlaying(true);

audioRef.current = new Audio(meditationAudio);
audioRef.current.loop=true;
audioRef.current.volume=0.4;
audioRef.current.play();

detectRef.current = setInterval(detect,400);

timerRef.current=setInterval(()=>{

setTotalTime(t=>t-1);

setStepTime(prev=>{

if(prev<=1){

const next = stepIndex+1;

if(next>=steps.length){

finish();
return 0;

}

setStepIndex(next);

return steps[next].duration;

}

return prev-1;

});

setProgress(
Math.round(((TOTAL_DURATION-totalTime)/TOTAL_DURATION)*100)
);

},1000);

};

/* ---------- STOP ---------- */

const stop=()=>{

clearInterval(timerRef.current);
clearInterval(detectRef.current);

audioRef.current?.pause();

setPlaying(false);

};

/* ---------- FINISH ---------- */

const finish=()=>{

stop();

let s = Number(localStorage.getItem("magic16_streak") || 0);

s++;

localStorage.setItem("magic16_streak",s);

setStreak(s);

if(s>50) setLevel("Zen Master");
else if(s>20) setLevel("Master");
else if(s>5) setLevel("Explorer");

if(score>90) setCoach("Excellent posture.");
else if(score>70) setCoach("Good work. Improve balance.");
else setCoach("Focus on knee alignment.");

confetti({particleCount:250,spread:120});

setCompleted(true);

};

/* ---------- SHARE ---------- */

const shareResult=()=>{

const text=`I completed Magic16 🧘
Score ${score}%
🔥 Streak ${streak}

Try it on ManifiX`;

navigator.share?.({
title:"Magic16 Challenge",
text,
url:"https://manifix.ai"
});

};

/* ---------- COMPLETED SCREEN ---------- */

if(completed){

return(

<div className="magic16-complete">

<h1>🎉 Ritual Complete</h1>

<h2>{score}% Posture Score</h2>

<p>🔥 {streak} Day Streak</p>

<p>Level: {level}</p>

<div className="magic16-coach">
<h3>AI Coach</h3>
<p>{coach}</p>
</div>

<button onClick={shareResult}>Share Result</button>

<button onClick={()=>window.location.reload()}>
Start Again
</button>

</div>

);

}

/* ---------- UI ---------- */

return(

<div className="magic16-app">

<header className="magic16-header">

<img src={logo} alt="logo"/>

<div className="magic16-streak">
🔥 {streak} day streak
</div>

</header>

{loading && (
<div className="magic16-loading">
Preparing your AI Yoga Trainer...
</div>
)}

<div className="magic16-layout">

<div className="magic16-camera">

<video
ref={videoRef}
autoPlay
playsInline
muted
className="magic16-video"
/>

<PostureOverlay/>

{stepIndex>=yogaSteps.length && (
<BreathingCircle/>
)}

</div>

<div className="magic16-panel">

<img
src={steps[stepIndex].img}
className="magic16-step-img"
/>

<h2>{steps[stepIndex].text}</h2>

<div className="magic16-progress">

<div style={{width:`${progress}%`}}/>

</div>

<div className="magic16-stats">

<span>Step {stepTime}s</span>

<span>Score {score}%</span>

</div>

<div className="magic16-controls">

{!playing ? (
<button onClick={start}>
Start Magic16
</button>
) : (
<button onClick={stop}>
Pause
</button>
)}

</div>

</div>

</div>

</div>

);

}
