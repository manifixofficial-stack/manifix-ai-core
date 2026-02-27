// hooks/useWarriorValidator.js

export function calculateAngle(A, B, C) {
  const AB = { x: A.x - B.x, y: A.y - B.y };
  const CB = { x: C.x - B.x, y: C.y - B.y };

  const dot = AB.x * CB.x + AB.y * CB.y;
  const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
  const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);

  const angle = Math.acos(dot / (magAB * magCB));
  return (angle * 180) / Math.PI;
}

export function validateWarrior(keypoints) {
  const hip = keypoints.find(k => k.name === "left_hip");
  const knee = keypoints.find(k => k.name === "left_knee");
  const ankle = keypoints.find(k => k.name === "left_ankle");

  if (!hip || !knee || !ankle) return null;

  const kneeAngle = calculateAngle(hip, knee, ankle);

  return {
    kneeAngle,
    isCorrect: kneeAngle > 80 && kneeAngle < 110
  };
}
