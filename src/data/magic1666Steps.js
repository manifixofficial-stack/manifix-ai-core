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
  { img: yoga1, text: "Mountain Pose. Stand tall and breathe deeply.", duration: 60 },
  { img: yoga2, text: "Forward Fold. Relax your neck.", duration: 40 },
  { img: yoga3, text: "Half Lift. Lengthen your spine.", duration: 40 },
  { img: yoga4, text: "Plank Pose. Engage your core.", duration: 60 },
  { img: yoga5, text: "Cobra Pose. Open your chest.", duration: 40 },
  { img: yoga6, text: "Downward Dog. Stretch fully.", duration: 60 },
  { img: yoga71, text: "Warrior Pose 1. Strong stance.", duration: 40 },
  { img: yoga72, text: "Warrior Pose 2. Focus stability.", duration: 40 },
  { img: yoga73, text: "Warrior Pose 3. Balance.", duration: 40 },
  { img: yoga8, text: "Tree Pose. Deep focus.", duration: 60 }
];

export const meditationSteps = [
  { img: med1, text: "Close your eyes and breathe slowly.", duration: 60 },
  { img: med2, text: "Focus on your breath.", duration: 60 },
  { img: med3, text: "Release tension.", duration: 120 },
  { img: med4, text: "Feel calm energy.", duration: 60 },
  { img: med5, text: "Let thoughts pass.", duration: 60 },
  { img: med6, text: "Stay present.", duration: 60 },
  { img: med7, text: "Visualize success.", duration: 60 }
];

export const magic16Steps = [...yogaSteps, ...meditationSteps];
