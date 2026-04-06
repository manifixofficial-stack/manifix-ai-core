import * as posedetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as tf from "@tensorflow/tfjs"
import confetti from "canvas-confetti"
import supabaseClient from "../services/supabase";
import "../styles/magic16.css"
import logo from "../assets/logo.png"
import html2canvas from "html2canvas"
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

import successSound from "../assets/audio/success.mp3"
import failSound from "../assets/audio/fail.mp3"
import comboSound from "../assets/audio/combo.mp3"
import countdownSound from "../assets/audio/countdown.mp3" 
import meditationAudio from "../assets/audio/meditation/meditation.mp3"

import { useRef, useEffect, useState } from "react"

export default function Magic16(){

  /* ---------------- REFS ---------------- */
  const videoRef = useRef(null)
  const detectorRef = useRef(null)
  const detectRef = useRef(null)
  const timerRef = useRef(null)
  const timeoutRef = useRef(null)
  const audioRef = useRef(null)

  /* ---------------- AUDIO ---------------- */
  const successSoundRef = useRef(new Audio(successSound))
  const failSoundRef = useRef(new Audio(failSound))
  const comboSoundRef = useRef(new Audio(comboSound))
  const winSoundRef = useRef(new Audio("/assets/audio/win.mp3"))
  const meditationRef = useRef(new Audio(meditationAudio))

  /* ---------------- STATE ---------------- */
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepTime, setStepTime] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [dailySteps, setDailySteps] = useState([])
  const [scores, setScores] = useState([])
  const [points, setPoints] = useState(0)
  const [reward, setReward] = useState("")
  const [lastScore, setLastScore] = useState(0)
  const [coach, setCoach] = useState("")
  const [userId, setUserId] = useState(localStorage.getItem("magic16_user") || crypto.randomUUID())
  const [progress, setProgress] = useState(0)
  const [xp, setXp] = useState(0)
  const xpToNext = 100
  const [level, setLevel] = useState("Beginner")
  const [finalScore, setFinalScore] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [friendScore, setFriendScore] = useState(0)
  const [streak, setStreak] = useState(Number(localStorage.getItem("magic16_streak") || 0))
  const [missedDay, setMissedDay] = useState(false)
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem("magic16_history") || "[]"))
  const [dailyGoal] = useState(80)
  const [goalAchieved, setGoalAchieved] = useState(false)
  const [loading, setLoading] = useState(true)

  /* ---------------- VOICE COACH ---------------- */
  const healthMessages = {
    excellent: ["🔥 Excellent posture! Spine alignment on point.","💪 Great control! Balance improving fast.","⚡ Epic! Keep slaying your yoga flow.","🏆 Legendary! Your body is leveling up."],
    good: ["🙂 Good posture! Keep breathing slowly.","👌 Doing well! Stay relaxed and focused.","✨ Nice flow! You're getting stronger each time.","💎 Solid! Keep the streak going."],
    improve: ["⬆️ Lift your chest slightly for perfect form.","🧘 Relax your shoulders and lengthen your spine.","⚠️ Adjust your posture, you got this!","🔥 Focus! Small tweaks = big gains."]
  }

  const speak = (text, options={})=>{
    if(!window.speechSynthesis) return
    speechSynthesis.cancel()
    const msg = new SpeechSynthesisUtterance(text)
    msg.rate = options.rate || (0.85 + Math.random()*0.15)
    msg.pitch = options.pitch || (0.9 + Math.random()*0.2)
    msg.lang = "en-US"
    if(options.onEnd) msg.onend = options.onEnd
    speechSynthesis.speak(msg)
  }

  const analyzeMovement = (score)=>{
    let level
    if(score>85){ level="excellent"; successSoundRef.current.play(); confetti({particleCount:50,spread:70,origin:{y:0.6}})}
    else if(score>65){ level="good"; comboSoundRef.current.play()}
    else{ level="improve"; failSoundRef.current.play()}
    const messages = healthMessages[level]
    const message = messages[Math.floor(Math.random()*messages.length)] + (level==="excellent"?" 🔥💪":level==="good"?" ⚡😊":" ⚠️🤏")
    setCoach(message)
    speak(message)
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

  /* ---------------- INIT ---------------- */
  useEffect(()=>{
    const init=async()=>{
      const userId = localStorage.getItem("magic16_user") || crypto.randomUUID()
      localStorage.setItem("magic16_user", userId)
      try{
        const stream = await navigator.mediaDevices.getUserMedia({video:true})
        if(videoRef.current) videoRef.current.srcObject = stream
      }catch(err){ console.error(err); alert("Camera access is required"); return }

      const today=new Date().toDateString()
      const lastDate = localStorage.getItem("magic16_lastDate")
      if(lastDate && lastDate !== today){ setStreak(0); localStorage.setItem("magic16_streak",0)}

      await tf.ready()
      await tf.setBackend("webgl")
      detectorRef.current = await posedetection.createDetector(posedetection.SupportedModels.MoveNet,{modelType:posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING})

      setDailySteps(steps)
      setLoading(false)
    }

    init()
    return ()=>{
      clearInterval(timerRef.current)
      cancelAnimationFrame(detectRef.current)
      if(videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop())
    }
  },[])

  const detectPose=async()=>{
    if(!detectorRef.current||!videoRef.current) return
    const poses = await detectorRef.current.estimatePoses(videoRef.current)
    if(!poses.length) return
    const kp=poses[0].keypoints
    const hip = kp.find(k=>k.name==="left_hip")
    const knee = kp.find(k=>k.name==="left_knee")
    const ankle = kp.find(k=>k.name==="left_ankle")
    if(hip && knee && ankle){
      const angle = Math.abs(Math.atan2(ankle.y-knee.y,ankle.x-knee.x)-Math.atan2(hip.y-knee.y,hip.x-knee.x))*180/Math.PI
      const sc = Math.round(Math.max(0,100-Math.abs(angle-90)))
      setScore(sc)
      const newCombo = sc>80?combo+1:0
      setCombo(newCombo)
      setScores(prev=>[...prev,sc].slice(-50))
      if(sc>lastScore+8){ try{successSoundRef.current.currentTime=0;successSoundRef.current.play()}catch{} setReward("🔥 Great posture! +8")}
      if(newCombo===4){ try{comboSoundRef.current.currentTime=0;comboSoundRef.current.play()}catch{} confetti({particleCount:50,spread:90,origin:{y:0.5}})}
      setPoints(prev=>prev+8)
      setXp(prev=>Math.min(prev+5,xpToNext))
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(()=>setReward(""),1500)
      setLastScore(sc)
      analyzeMovement(sc)
    }
    detectRef.current = requestAnimationFrame(detectPose)
  }

  const runDetection=()=>{ detectPose(); detectRef.current=requestAnimationFrame(runDetection) }
  const stop=()=>{
    clearInterval(timerRef.current)
    clearTimeout(timeoutRef.current)
    cancelAnimationFrame(detectRef.current)
    speechSynthesis.cancel()
    audioRef.current?.pause()
    audioRef.current.currentTime=0
    setPlaying(false)
    setCombo(0)
    setPoints(0)
  }

  const start=()=>{
    if(playing) return
    setPlaying(true)
    speak(`Welcome to Magic sixteen. ${dailySteps[0]?.text}`)
    runDetection()
    let totalSteps = dailySteps.length
    timerRef.current = setInterval(()=>{
      setStepTime(prev=>{
        if(prev<=1){
          setStepIndex(prevIndex=>{
            const next=prevIndex+1
            if(next>=dailySteps.length){ stop(); return prevIndex }
            speak(dailySteps[next].text)
            return next
          })
          return dailySteps[stepIndex].duration
        }
        return prev-1
      })
    },1000)
  }

  const share=async()=>{
    const card=document.getElementById("share-card")
    if(!card) return
    const canvas = await html2canvas(card)
    const blob = await new Promise(resolve=>canvas.toBlob(resolve,"image/png"))
    if(!blob) return alert("Failed to capture image")
    const file = new File([blob],"magic16.png",{type:"image/png"})
    try{
      if(navigator.share){ await navigator.share({title:"🔥 Can you beat me?", text:`I scored ${finalScore}% 😈`, files:[file]}) }
      else{ const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="magic16.png"; a.click(); alert("Image downloaded 🚀") }
    }catch(e){ console.log("Share cancelled") }
  }

  /* ---------------- MAIN UI ---------------- */
  if(loading) return <div className="magic16-loading">Preparing AI Trainer...</div>
  return (
    <div className="magic16-app neon-glow">
      <header className="magic16-header">
        <img src={logo} alt="Magic16 Logo" className="logo-neon"/>
        <div className="magic16-streak">🔥 {streak} Day Streak</div>
        <div className="magic16-xp">
          <div className="xp-bar">
            <div style={{width:`${(xp/xpToNext)*100}%`}} className="xp-bar-fill"/>
          </div>
          <p>XP: {xp}/{xpToNext}</p>
        </div>
      </header>

      <div className="magic16-camera">
        <video ref={videoRef} autoPlay playsInline muted className="magic16-video"/>
      </div>

      <div className="magic16-panel neon-panel">
        <h3>🔥 Step: {dailySteps[stepIndex]?.text}</h3>
        <img src={dailySteps[stepIndex]?.img} alt="step" className="magic16-step-img"/>
        <p className="magic16-coach">{coach}</p>
        {reward && <div className="magic16-reward neon-text">{reward}</div>}
        <div className="magic16-progress-bar neon-progress">
          <div style={{width:`${progress}%`}}/>
        </div>
        <button className="neon-btn" onClick={start}>▶ Start</button>
        <button className="neon-btn" onClick={stop}>⏹ Stop</button>
        <button className="neon-btn" onClick={share}>📤 Share</button>
      </div>
    </div>
  )
} 
