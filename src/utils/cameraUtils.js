/* ==========================================================
 * ManifiX — Camera Utilities
 * ----------------------------------------------------------
 * Responsibilities:
 * - Access webcam / device camera
 * - Capture video stream
 * - Take snapshots (image capture)
 * - Extract frames for Vision AI (face, posture, emotion)
 * - Mobile & desktop compatible
 * - Handles permissions and errors gracefully
 * ========================================================== */

class CameraUtils {
  constructor() {
    this.stream = null;
    this.videoElement = null;
  }

  /**
   * Request camera access and attach to video element
   * @param {HTMLVideoElement} videoEl
   * @param {object} options - { width, height, facingMode }
   */
  async startCamera(videoEl, options = { width: 640, height: 480, facingMode: "user" }) {
    if (!videoEl) throw new Error("Video element is required");

    this.videoElement = videoEl;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: options.width,
          height: options.height,
          facingMode: options.facingMode,
        },
        audio: false, // audio handled separately by voiceService
      });

      videoEl.srcObject = this.stream;
      await videoEl.play();
      console.log("🎥 Camera started successfully");
    } catch (error) {
      console.error("❌ Camera access denied or error:", error);
      throw error;
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      console.log("⏹️ Camera stopped");
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Capture current frame from video as an ImageBitmap
   * @returns {Promise<ImageBitmap>}
   */
  async captureFrame() {
    if (!this.videoElement) throw new Error("Video element not initialized");

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    return await createImageBitmap(canvas);
  }

  /**
   * Capture current frame as Base64 image
   * @returns {string} Base64-encoded image
   */
  captureFrameBase64() {
    if (!this.videoElement) throw new Error("Video element not initialized");

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  }

  /**
   * Check if camera is active
   * @returns {boolean}
   */
  isActive() {
    return !!this.stream;
  }

  /**
   * Toggle camera on/off
   * @param {HTMLVideoElement} videoEl
   * @param {object} options
   */
  async toggleCamera(videoEl, options = {}) {
    if (this.isActive()) this.stopCamera();
    else await this.startCamera(videoEl, options);
  }
}

// 🔒 Singleton instance
const cameraUtils = new CameraUtils();
export default cameraUtils;

/* ===============================
 * Example Usage:
 * ===============================
 * import cameraUtils from "./CameraUtils.js";
 * 
 * const videoEl = document.querySelector("#camera");
 * 
 * // Start camera
 * await cameraUtils.startCamera(videoEl, { width: 1280, height: 720, facingMode: "user" });
 * 
 * // Capture frame
 * const imageBitmap = await cameraUtils.captureFrame();
 * const base64 = cameraUtils.captureFrameBase64();
 * 
 * // Stop camera
 * cameraUtils.stopCamera();
 * 
 * // Toggle camera
 * await cameraUtils.toggleCamera(videoEl);
 * =============================== */
