// src/hooks/useDetection.ts

import { useEffect, useRef, useState, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import * as facedetection from "@tensorflow-models/face-detection";
import "@tensorflow/tfjs-backend-webgl";

export default function useDetection(videoRef: any, canvasRef: any) {
  const poseDetectorRef = useRef<any>(null);
  const faceDetectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectInterval = useRef<NodeJS.Timeout | null>(null);

  const postureSamples = useRef<number[]>([]);
  const faceSamples = useRef<number[]>([]);
  const lastFaceX = useRef<number | null>(null);

  const [postureScore, setPostureScore] = useState(0);
  const [faceScore, setFaceScore] = useState(0);
  const [healthScore, setHealthScore] = useState(0);

  // Init camera + models
  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      poseDetectorRef.current = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet
      );

      faceDetectorRef.current = await facedetection.createDetector(
        facedetection.SupportedModels.MediaPipeFaceDetector,
        { runtime: "tfjs" }
      );
    };

    init();

    return () => {
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      stop();
    };
  }, [videoRef]);

  const detect = useCallback(async () => {
    if (!videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, 640, 480);

    const poses = await poseDetectorRef.current?.estimatePoses(videoRef.current);
    const faces = await faceDetectorRef.current?.estimateFaces(videoRef.current);

    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

    // -------- POSTURE --------
    if (poses?.length > 0) {
      const keypoints = poses[0].keypoints;

      const ls = keypoints.find((k: any) => k.name === "left_shoulder");
      const rs = keypoints.find((k: any) => k.name === "right_shoulder");
      const lh = keypoints.find((k: any) => k.name === "left_hip");
      const rh = keypoints.find((k: any) => k.name === "right_hip");

      if (ls && rs && lh && rh) {
        const shoulderDiff = Math.abs(ls.y - rs.y);
        const hipDiff = Math.abs(lh.y - rh.y);
        const score = Math.max(0, 100 - (shoulderDiff + hipDiff) / 5);

        postureSamples.current.push(score);
        setPostureScore(Math.round(score));
      }
    }

    // -------- FACE --------
    if (faces?.length > 0) {
      const box = faces[0].box;

      if (lastFaceX.current !== null) {
        const movement = Math.abs(box.xMin - lastFaceX.current);
        const stability = Math.max(0, 100 - movement);
        faceSamples.current.push(stability);
        setFaceScore(Math.round(stability));
      }

      lastFaceX.current = box.xMin;
      ctx.strokeStyle = "#00f5c4";
      ctx.strokeRect(box.xMin, box.yMin, box.width, box.height);
    }
  }, [videoRef, canvasRef]);

  const start = () => {
    detectInterval.current = setInterval(detect, 500);
  };

  const stop = () => {
    if (detectInterval.current) {
      clearInterval(detectInterval.current);
      detectInterval.current = null;
    }
  };

  const calculateFinalScore = () => {
    const avgPosture =
      postureSamples.current.reduce((a, b) => a + b, 0) /
        postureSamples.current.length || 0;

    const avgFace =
      faceSamples.current.reduce((a, b) => a + b, 0) /
        faceSamples.current.length || 0;

    const final = Math.round(avgPosture * 0.6 + avgFace * 0.4);

    setHealthScore(final);

    return {
      avgPosture: Math.round(avgPosture),
      avgFace: Math.round(avgFace),
      final,
    };
  };

  return {
    postureScore,
    faceScore,
    healthScore,
    start,
    stop,
    calculateFinalScore,
  };
}
