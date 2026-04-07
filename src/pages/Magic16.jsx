import { useRef, useEffect, useState } from "react"
import * as posedetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as tf from "@tensorflow/tfjs"
import confetti from "canvas-confetti"

import "../styles/magic16.css"
import logo from "../assets/logo.png"

/* yoga images */
import yoga1 from "../assets/steps/yoga-01.png"
import yoga2 from "../assets/steps/yoga-02.png"
import yoga3 from "../assets/steps/yoga-03.png"
import yoga4 from "../assets/steps/yoga-04.png"
import yoga5 from "../assets/steps/yoga-05.png"
import yoga6 from "../assets/steps/yoga-06.png"
import yoga71 from "../assets/steps/yoga-07-1.png"
import yoga72 from "../assets/steps/yoga-07-2.png"
import yoga73 from "../assets/steps/yoga-07-3.png"
import yoga8 from "../assets/steps/yoga-08.png"

/* meditation images */
import med1 from "../assets/steps/med-01.png"
import med2 from "../assets/steps/med-02.png"
import med3 from "../assets/steps/med-03.png"
import med4 from "../assets/steps/med-04.png"
import med5 from "../assets/steps/med-05.png"
import med6 from "../assets/steps/med-06.png"
import med7 from "../assets/steps/med-07.png"

/* meditation audio */
import meditationAudio from "../assets/audio/meditation/meditation.mp3"

export default function Magic16(){

/* ---------------- REFS ---------------- */

const videoRef = useRef(null)
const detectorRef = useRef(null)
const timerRef = useRef(null)
const detectRef = useRef(null)
const audioRef = useRef(null)

/* ---------------- STATE ---------------- */

const [loading,setLoading] = useState(true)
const [playing,setPlaying] = useState(false)
const [completed,setCompleted] = useState(false)

const [stepIndex,setStepIndex] = useState(0)
const [stepTime,setStepTime] = useState(60)

const [progress,setProgress] = useState(0)
const [score,setScore] = useState(0)

const [coach,setCoach] = useState("")
const [level,setLevel] = useState("Beginner")

const [streak,setStreak] = useState(
Number(localStorage.getItem("magic16_streak") || 0)
)

/* ---------------- HUMAN COACH MESSAGES ---------------- */

const healthMessages = {

excellent:[
"Excellent posture. Your spine alignment is strong.",
"Great control. Your balance is improving."
],

good:[
"Good posture. Keep breathing slowly.",
"You are doing well. Stay relaxed."
],

improve:[
"Lift your chest slightly.",
"Relax your shoulders and lengthen your spine."
]

}

/* ---------------- VOICE COACH ---------------- */

const speak = (text)=>{

const msg = new SpeechSynthesisUtterance(text)
msg.rate = 0.9
msg.pitch = 1
msg.lang = "en-US"

speechSynthesis.cancel()
speechSynthesis.speak(msg)

}

/* ---------------- MOVEMENT ANALYSIS ---------------- */

const analyzeMovement = (score)=>{

let level

if(score > 85){
level="excellent"
}else if(score > 65){
level="good"
}else{
level="improve"
}

const messages = healthMessages[level]

const message =
messages[Math.floor(Math.random()*messages.length)]

setCoach(message)

}

/* ---------------- STEPS ---------------- */

const steps=[

{type:"yoga",img:yoga1,text:"Mountain Pose. Stand tall.",duration:60},
{type:"yoga",img:yoga2,text:"Forward Fold. Relax your spine.",duration:60},
{type:"yoga",img:yoga3,text:"Half Lift. Lengthen your back.",duration:60},
{type:"yoga",img:yoga4,text:"Plank Pose. Engage your core.",duration:60},
{type:"yoga",img:yoga5,text:"Cobra Pose. Open your chest.",duration:60},
{type:"yoga",img:yoga6,text:"Downward Dog. Stretch your body.",duration:60},
{type:"yoga",img:yoga71,text:"Warrior One.",duration:60},
{type:"yoga",img:yoga72,text:"Warrior Two.",duration:60},
{type:"yoga",img:yoga73,text:"Warrior Three.",duration:60},
{type:"yoga",img:yoga8,text:"Tree Pose. Balance your body.",duration:60},

{type:"meditation",img:med1,text:"Close your eyes and breathe slowly.",duration:120},
{type:"meditation",img:med2,text:"Focus on breathing.",duration:120},
{type:"meditation",img:med3,text:"Release tension.",duration:120},
{type:"meditation",img:med4,text:"Feel calm.",duration:120},
{type:"meditation",img:med5,text:"Let thoughts pass.",duration:120},
{type:"meditation",img:med6,text:"Stay present.",duration:120},
{type:"meditation",img:med7,text:"Visualize success.",duration:120}

]

const TOTAL = steps.reduce((s,x)=>s+x.duration,0)
const [totalTime,setTotalTime] = useState(TOTAL)

/* ---------------- INIT CAMERA + AI ---------------- */

useEffect(()=>{

const init = async()=>{

const stream =
await navigator.mediaDevices.getUserMedia({video:true})

videoRef.current.srcObject = stream

await tf.ready()
await tf.setBackend("webgl")

detectorRef.current =
await posedetection.createDetector(
posedetection.SupportedModels.MoveNet,
{modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING}
)

/* meditation audio */

audioRef.current = new Audio(meditationAudio)
audioRef.current.loop = true
audioRef.current.volume = 0.4

setLoading(false)

}

init()

return ()=>{

clearInterval(timerRef.current)
clearInterval(detectRef.current)

}

},[])

/* ---------------- POSE DETECTION ---------------- */

const detectPose = async()=>{

if(!detectorRef.current) return

const poses =
await detectorRef.current.estimatePoses(videoRef.current)

if(!poses.length) return

const kp = poses[0].keypoints

const hip = kp.find(k=>k.name==="left_hip")
const knee = kp.find(k=>k.name==="left_knee")
const ankle = kp.find(k=>k.name==="left_ankle")

if(hip && knee && ankle){

const angle = Math.abs(
Math.atan2(ankle.y-knee.y,ankle.x-knee.x) -
Math.atan2(hip.y-knee.y,hip.x-knee.x)
)*180/Math.PI

const postureScore =
Math.max(0,100-Math.abs(angle-90))

const sc = Math.round(postureScore)

setScore(sc)

analyzeMovement(sc)

}

}

/* ---------------- START SESSION ---------------- */

const start = ()=>{

if(playing) return

setPlaying(true)

speak("Welcome to Magic sixteen.")

speak(steps[0].text)

detectRef.current = setInterval(detectPose,500)

timerRef.current = setInterval(()=>{

setTotalTime(prevTotal => {

const newTotal = prevTotal - 1

setProgress(
Math.round(((TOTAL - newTotal) / TOTAL) * 100)
)

return newTotal

})

setStepTime(prev => {

if(prev <= 1){

setStepIndex(prevIndex => {

const next = prevIndex + 1

if(next >= steps.length){
finish()
return prevIndex
}

/* play meditation audio */

if(steps[next].type === "meditation"){
audioRef.current?.play()
}else{
audioRef.current?.pause()
}

speak(steps[next].text)

setStepTime(steps[next].duration)

return next

})

return prev

}

return prev - 1

})

},1000)
}

/* ---------------- STOP ---------------- */

const stop = ()=>{

clearInterval(timerRef.current)
clearInterval(detectRef.current)

speechSynthesis.cancel()

audioRef.current?.pause()

setPlaying(false)

}

/* ---------------- FINISH ---------------- */

const finish = ()=>{

stop()

let s =
Number(localStorage.getItem("magic16_streak") || 0)

s++

localStorage.setItem("magic16_streak",s)

setStreak(s)

if(s>50) setLevel("Zen Master")
else if(s>20) setLevel("Master")
else if(s>5) setLevel("Explorer")

confetti({particleCount:200,spread:120})

setCompleted(true)

}

/* ---------------- SHARE ---------------- */

const share = ()=>{

navigator.share?.({

title:"Magic16",
text:`I completed Magic16 🧘 Score ${score}%`,
url:"https://manifix.ai"

})

}

/* ---------------- COMPLETED SCREEN ---------------- */

if(completed){

return(

<div className="magic16-complete">

<h1>🎉 Ritual Complete</h1>

<h2>{score}% Posture Score</h2>

<p>🔥 {streak} Day Streak</p>

<p>Level: {level}</p>

<p>{coach}</p>

<button onClick={share}>Share</button>

<button onClick={()=>window.location.reload()}>
Start Again
</button>

</div>

)

}

/* ---------------- MAIN UI ---------------- */

return(

<div className="magic16-app">

<header className="magic16-header">

<img src={logo} alt="logo"/>

<div className="magic16-streak">
🔥 {streak} Day Streak
</div>

</header>

{loading &&
<div className="magic16-loading">
Preparing AI Trainer...
</div>
}

<div className="magic16-layout">

<div className="magic16-camera">

<video
ref={videoRef}
autoPlay
playsInline
muted
className="magic16-video"
/>

</div>

<div className="magic16-panel">

<img
src={steps[stepIndex]?.img}
className="magic16-step-img"
/>

<h2>{steps[stepIndex]?.text}</h2>

<p className="magic16-coach">
{coach}
</p>

<div className="magic16-progress">

<div style={{width:`${progress}%`}}/>

</div>

<div className="magic16-stats">

<span>Step {stepTime}s</span>
<span>Score {score}%</span>

</div>

<div className="magic16-controls">

{!playing ?

<button onClick={start}>
Start Magic16
</button>

:

<button onClick={stop}>
Pause
</button>

}

</div>

</div>

</div>

</div>

)

}
 magic16 upgrade featuresssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
