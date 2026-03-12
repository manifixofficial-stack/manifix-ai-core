// Yoga Steps
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

// Meditation Steps
import med1 from "../assets/steps/med-01.png";
import med2 from "../assets/steps/med-02.png";
import med3 from "../assets/steps/med-03.png";
import med4 from "../assets/steps/med-04.png";
import med5 from "../assets/steps/med-05.png";
import med6 from "../assets/steps/med-06.png";
import med7 from "../assets/steps/med-07.png";

export const yogaSteps = [
  { id:1, title:"Mountain Pose", img: yoga1, text: "Stand tall and breathe deeply.", duration: 60 },
  { id:2, title:"Forward Fold", img: yoga2, text: "Relax your neck.", duration: 40 },
  { id:3, title:"Half Lift", img: yoga3, text: "Lengthen your spine.", duration: 40 },
  { id:4, title:"Plank Pose", img: yoga4, text: "Engage your core.", duration: 60 },
  { id:5, title:"Cobra Pose", img: yoga5, text: "Open your chest.", duration: 40 },
  { id:6, title:"Downward Dog", img: yoga6, text: "Stretch fully.", duration: 60 },
  { id:7, title:"Warrior Pose 1", img: yoga71, text: "Strong stance.", duration: 40 },
  { id:8, title:"Warrior Pose 2", img: yoga72, text: "Focus stability.", duration: 40 },
  { id:9, title:"Warrior Pose 3", img: yoga73, text: "Balance.", duration: 40 },
  { id:10, title:"Tree Pose", img: yoga8, text: "Deep focus.", duration: 60 }
];

export const meditationSteps = [
  { id:11, title:"Breathing", img: med1, text: "Close your eyes and breathe slowly.", duration: 60 },
  { id:12, title:"Focus", img: med2, text: "Focus on your breath.", duration: 60 },
  { id:13, title:"Release", img: med3, text: "Release tension.", duration: 120 },
  { id:14, title:"Energy", img: med4, text: "Feel calm energy.", duration: 60 },
  { id:15, title:"Let Go", img: med5, text: "Let thoughts pass.", duration: 60 },
  { id:16, title:"Presence", img: med6, text: "Stay present.", duration: 60 },
  { id:17, title:"Visualization", img: med7, text: "Visualize success.", duration: 60 }
];

export const magic16Steps = [...yogaSteps, ...meditationSteps];
