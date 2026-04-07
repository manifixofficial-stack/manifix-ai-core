import { useRef, useEffect, useState } from "react"
import * as posedetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as tf from "@tensorflow/tfjs"
import confetti from "canvas-confetti"

import "../styles/magic16.css"
import logo from "../assets/logo.png"

/* ------------------- YOGA IMAGES ------------------- */
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

/* ---------------- MEDITATION IMAGES ---------------- */
import med1 from "../assets/steps/med-01.png"
import med2 from "../assets/steps/med-02.png"
import med3 from "../assets/steps/med-03.png"
import med4 from "../assets/steps/med-04.png"
import med5 from "../assets/steps/med-05.png"
import med6 from "../assets/steps/med-06.png"
import med7 from "../assets/steps/med-07.png"

/* ---------------- MEDITATION AUDIO ---------------- */
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

/* ---------------- COACH MESSAGES ---------------- */
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
  if(score > 85) level="excellent"
  else if(score > 65) level="good"
  else level="improve"

  const messages = healthMessages[level]
  const message = messages[Math.floor(Math.random()*messages.length)]
  setCoach(message)
}

/* ---------------- ALL STEPS POOL ---------------- */
const allYogaSteps = [
  yoga1,yoga2,yoga3,yoga4,yoga5,yoga6,yoga71,yoga72,yoga73,yoga8
]
const allYogaTexts = [
  "Mountain Pose. Stand tall.",
  "Forward Fold. Relax your spine.",
  "Half Lift. Lengthen your back.",
  "Plank Pose. Engage your core.",
  "Cobra Pose. Open your chest.",
  "Downward Dog. Stretch your body.",
  "Warrior One.",
  "Warrior Two.",
  "Warrior Three.",
  "Tree Pose. Balance your body."
]

const allMedSteps = [
  med1,med2,med3,med4,med5,med6,med7
]
const allMedTexts = [
  "Close your eyes and breathe slowly.",
  "Focus on breathing.",
  "Release tension.",
  "Feel calm.",
  "Let thoughts pass.",
  "Stay present.",
  "Visualize success."
]

/* ---------------- HELPER: PICK UNIQUE STEPS ---------------- */
const pickUniqueSteps = (pool,texts,count,usedSteps)=>{
  const available = pool
    .map((img,i)=>({img,text:texts[i]}))
    .filter(s=>!usedSteps.includes(s.img))

  // Shuffle and pick
  const shuffled = available.sort(()=>Math.random()-0.5).slice(0,count)
  return shuffled
}

/* ---------------- LOAD DAILY STEPS ---------------- */
let steps=[]
const today = new Date().toDateString()

// load 7-day history
const history = JSON.parse(localStorage.getItem("magic16_history")||"[]")
const last7Steps = history.flatMap(h=>h.steps)

if(localStorage.getItem("magic16_session_date")!==today){
  const dailyYogaSteps = pickUniqueSteps(allYogaSteps,allYogaTexts,8,last7Steps)
  const dailyMedSteps = pickUniqueSteps(allMedSteps,allMedTexts,8,last7Steps)

  steps = [
    ...dailyYogaSteps.map(s=>({...s,type:"yoga",duration:60})),
    ...dailyMedSteps.map(s=>({...s,type:"meditation",duration:120}))
  ]

  localStorage.setItem("magic16_steps",JSON.stringify(steps))
  localStorage.setItem("magic16_session_date",today)

  // update history
  history.push({date:today,steps:steps.map(s=>s.img)})
  if(history.length>7) history.shift() // keep last 7 days
  localStorage.setItem("magic16_history",JSON.stringify(history))
}else{
  steps = JSON.parse(localStorage.getItem("magic16_steps"))
}

/* ---------------- TOTAL TIME ---------------- */
const TOTAL = steps.reduce((s,x)=>s+x.duration,0)
const [totalTime,setTotalTime] = useState(TOTAL)

/* ---------------- INIT CAMERA + AI ---------------- */
useEffect(()=>{
  const init = async()=>{
    const stream = await navigator.mediaDevices.getUserMedia({video:true})
    videoRef.current.srcObject = stream

    await tf.ready()
    await tf.setBackend("webgl")

    detectorRef.current = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet,
      {modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING}
    )

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
  const poses = await detectorRef.current.estimatePoses(videoRef.current)
  if(!poses.length) return

  const kp = poses[0].keypoints
  const hip = kp.find(k=>k.name==="left_hip")
  const knee = kp.find(k=>k.name==="left_knee")
  const ankle = kp.find(k=>k.name==="left_ankle")

  if(hip && knee && ankle){
    const angle = Math.abs(
      Math.atan2(ankle.y-knee.y,ankle.x-knee.x)-
      Math.atan2(hip.y-knee.y,hip.x-knee.x)
    )*180/Math.PI

    const postureScore = Math.max(0,100-Math.abs(angle-90))
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
    setTotalTime(prevTotal=>{
      const newTotal = prevTotal-1
      setProgress(Math.round(((TOTAL-newTotal)/TOTAL)*100))
      return newTotal
    })

    setStepTime(prev=>{
      if(prev<=1){
        setStepIndex(prevIndex=>{
          const next = prevIndex+1
          if(next>=steps.length){
            finish()
            return prevIndex
          }

          if(steps[next].type==="meditation") audioRef.current?.play()
          else audioRef.current?.pause()

          speak(steps[next].text)
          setStepTime(steps[next].duration)
          return next
        })
        return prev
      }
      return prev-1
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
  let s = Number(localStorage.getItem("magic16_streak")||0)
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
      <button onClick={()=>window.location.reload()}>Start Again</button>
    </div>
  )
}

/* ---------------- MAIN UI ---------------- */
return(
  <div className="magic16-app">
    <header className="magic16-header">
      <img src={logo} alt="logo"/>
      <div className="magic16-streak">🔥 {streak} Day Streak</div>
    </header>

    {loading && <div className="magic16-loading">Preparing AI Trainer...</div>}

    <div className="magic16-layout">
      <div className="magic16-camera">
        <video ref={videoRef} autoPlay playsInline muted className="magic16-video"/>
      </div>

      <div className="magic16-panel">
        <img src={steps[stepIndex]?.img} className="magic16-step-img"/>
        <h2>{steps[stepIndex]?.text}</h2>
        <p className="magic16-coach">{coach}</p>

        <div className="magic16-progress"><div style={{width:`${progress}%`}}/></div>
        <div className="magic16-stats">
          <span>Step {stepTime}s</span>
          <span>Score {score}%</span>
        </div>

        <div className="magic16-controls">
          {!playing ?
            <button onClick={start}>Start Magic16</button> :
            <button onClick={stop}>Pause</button>
          }
        </div>
      </div>
    </div>
  </div>
)
}
