importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection");

let detector;

self.onmessage = async (e) => {
  if (e.data.type === "init") {
    detector = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet
    );
  }

  if (e.data.type === "detect") {
    const poses = await detector.estimatePoses(e.data.frame);
    self.postMessage(poses);
  }
};
