/* ==========================================================
 * ManifiX — Device Service
 * ----------------------------------------------------------
 * Responsibilities:
 * - Detect device capabilities
 * - Handle permissions (mic, camera, motion)
 * - Manage hardware access safely
 * - Cross-platform (mobile / desktop / tablet)
 *
 * Privacy-first. User consent always required.
 * ========================================================== */

class DeviceService {
  constructor() {
    this.mediaStream = null;
  }

  // ===============================
  // 📱 DEVICE INFO
  // ===============================
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      touch: "ontouchstart" in window,
      mobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    };
  }

  // ===============================
  // 🎤 MICROPHONE ACCESS
  // ===============================
  async requestMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.mediaStream = stream;
      return stream;
    } catch (error) {
      throw new Error("Microphone permission denied");
    }
  }

  // ===============================
  // 📷 CAMERA ACCESS
  // ===============================
  async requestCamera({ facingMode = "user" } = {}) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      this.mediaStream = stream;
      return stream;
    } catch (error) {
      throw new Error("Camera permission denied");
    }
  }

  // ===============================
  // 🔁 STOP MEDIA STREAM
  // ===============================
  stopMedia() {
    if (!this.mediaStream) return;

    this.mediaStream.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  // ===============================
  // 📸 CAPTURE IMAGE FROM CAMERA
  // ===============================
  captureFrame(videoElement) {
    if (!videoElement) return null;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0);

    return canvas.toDataURL("image/png");
  }

  // ===============================
  // 🧭 MOTION / ORIENTATION
  // ===============================
  async requestMotionAccess(callback) {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        throw new Error("Motion permission denied");
      }
    }

    window.addEventListener("devicemotion", callback);
  }

  stopMotionAccess(callback) {
    window.removeEventListener("devicemotion", callback);
  }

  // ===============================
  // 🔐 PERMISSION CHECKER
  // ===============================
  async checkPermission(name) {
    if (!navigator.permissions) return "unknown";
    const result = await navigator.permissions.query({ name });
    return result.state; // granted | denied | prompt
  }

  // ===============================
  // 🧹 CLEANUP (IMPORTANT)
  // ===============================
  cleanup() {
    this.stopMedia();
  }
}

// 🔒 SINGLETON INSTANCE
const deviceService = new DeviceService();
export default deviceService;
