class VisionService {
  constructor() {
    this.videoElement = null;
    this.onUpdate = null;
    this.interval = null;
  }

  async startCamera(videoElement, { onUpdate, fps = 5 } = {}) {
    if (!videoElement) throw new Error("Video element required");
    this.videoElement = videoElement;
    this.onUpdate = onUpdate;

    this.videoElement.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
    await this.videoElement.play();

    this.interval = setInterval(() => this._processFrame(), 1000 / fps);
  }

  async _processFrame() {
    if (!this.videoElement) return;

    // ⚡ Placeholder AI (replace with Magic16 integration later)
    const result = {
      faceCount: 1, // assume one face detected
      emotions: [{ happy: 0.8, calm: 0.2 }],
      posture: "standing",
    };

    if (this.onUpdate) this.onUpdate(result);
  }

  stopCamera() {
    if (this.interval) clearInterval(this.interval);
    if (this.videoElement && this.videoElement.srcObject) {
      this.videoElement.srcObject.getTracks().forEach((t) => t.stop());
      this.videoElement.srcObject = null;
    }
  }
}

const visionService = new VisionService();
export default visionService;
