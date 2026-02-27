/* ==========================================================
 * ManifiX — Vision Utilities
 * ----------------------------------------------------------
 * Responsibilities:
 * - Camera access & control
 * - Face detection
 * - Posture analysis
 * - Emotion recognition
 * - Integrates with visionService
 * ========================================================== */

import visionService from "../services/vision.service.js";

/**
 * Initialize vision system
 */
export async function initVision() {
  await visionService.init();
}

/**
 * Start camera stream
 * @param {HTMLVideoElement} videoElement
 * @param {Object} options - { fps, onUpdate }
 */
export async function startCamera(videoElement, options = {}) {
  if (!videoElement) throw new Error("Video element is required");
  await visionService.startCamera(videoElement, options);
}

/**
 * Stop camera stream and cleanup
 */
export function stopCamera() {
  visionService.stopCamera();
  visionService.cleanup();
}

/**
 * Get latest vision data (faces, emotions, posture)
 * @returns {Object} { faceCount, emotions, posture }
 */
export function getVisionData() {
  return visionService.getData();
}

/**
 * Example Usage:
 * 
 * import { initVision, startCamera, stopCamera, getVisionData } from "../utils/VisionUtils.js";
 * 
 * const videoEl = document.getElementById("camera");
 * await initVision();
 * await startCamera(videoEl, {
 *   fps: 5,
 *   onUpdate: (data) => console.log("Vision update:", data)
 * });
 * 
 * const currentData = getVisionData();
 * console.log(currentData);
 * 
 * stopCamera();
 */
