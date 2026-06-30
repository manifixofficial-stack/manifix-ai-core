import React, { useState, useRef, useEffect } from 'react';

const GOLD = '#ffc83c';
const GOLD_DEEP = '#c8a84b';
const BLACK = '#080808';

const PulseVisualizer = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusText, setStatusText] = useState('Ready to pair with device camera...');
  const [showResults, setShowResults] = useState(false);
  const [bpm, setBpm] = useState('--');
  const [signalQuality, setSignalQuality] = useState('--');
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const bufferCanvasRef = useRef(null);
  const waveCanvasRef = useRef(null);

  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dataPointsRef = useRef([]); // { t: timestamp, v: avgRed }
  const startTimeRef = useRef(0);

  const DURATION = 15000; // 15s capture window — enough for ~10-20 beats at rest

  useEffect(() => {
    const handleResize = () => {
      if (waveCanvasRef.current) {
        waveCanvasRef.current.width = waveCanvasRef.current.offsetWidth * 2;
        waveCanvasRef.current.height = waveCanvasRef.current.offsetHeight * 2;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startCapture = async () => {
    try {
      setIsCapturing(true);
      setShowResults(false);
      setProgress(0);
      dataPointsRef.current = [];
      setStatusText('Connecting to camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};

      if (capabilities.torch) {
        await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
      } else {
        setStatusText('Torch unavailable — move to a bright, well-lit room.');
      }

      setStatusText('Cover the camera and flash fully with your fingertip. Hold still...');
      startTimeRef.current = Date.now();
      executeProcessingLoop();
    } catch (error) {
      console.error(error);
      setStatusText('Camera access denied or unavailable. Check permissions and try again.');
      setIsCapturing(false);
    }
  };

  const executeProcessingLoop = () => {
    const elapsed = Date.now() - startTimeRef.current;
    setProgress(Math.min(100, (elapsed / DURATION) * 100));

    if (elapsed >= DURATION) {
      terminateStream();
      return;
    }

    const bufferCanvas = bufferCanvasRef.current;
    const video = videoRef.current;

    if (bufferCanvas && video && video.readyState >= 2) {
      const bufferCtx = bufferCanvas.getContext('2d', { willReadFrequently: true });
      bufferCtx.drawImage(video, 0, 0, bufferCanvas.width, bufferCanvas.height);
      const frame = bufferCtx.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height).data;

      let redSum = 0;
      const pixelCount = frame.length / 4;
      for (let i = 0; i < frame.length; i += 4) {
        redSum += frame[i];
      }
      const avgRed = redSum / pixelCount;

      dataPointsRef.current.push({ t: Date.now(), v: avgRed });
      renderWaveGraph();
    }

    animationFrameRef.current = requestAnimationFrame(executeProcessingLoop);
  };

  const renderWaveGraph = () => {
    const waveCanvas = waveCanvasRef.current;
    if (!waveCanvas) return;

    const ctx = waveCanvas.getContext('2d');
    ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

    const maxHistoryMs = 6000; // show last 6 seconds of wave
    const now = Date.now();
    const points = dataPointsRef.current.filter(p => now - p.t <= maxHistoryMs);
    if (points.length < 2) return;

    const values = points.map(p => p.v);
    const dataMax = Math.max(...values);
    const dataMin = Math.min(...values);
    const range = (dataMax - dataMin) || 1;

    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 8;
    ctx.beginPath();

    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * waveCanvas.width;
      const norm = ((p.v - dataMin) / range) * (waveCanvas.height - 24) + 12;
      const y = waveCanvas.height - norm;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const terminateStream = () => {
    cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.stop());
    }
    setStatusText('Analysis complete.');
    setIsCapturing(false);
    processFinalMetrics();
  };

  // --- Real peak-detection BPM calculation ---
  const processFinalMetrics = () => {
    const raw = dataPointsRef.current;
    if (raw.length < 60) {
      setStatusText('Not enough data captured. Try again, holding the finger steadier.');
      return;
    }

    // 1. Smooth the signal with a small moving average to reduce camera noise
    const smoothed = movingAverage(raw.map(p => p.v), 5);

    // 2. Detect peaks: local maxima above a minimum prominence, with a
    //    minimum-distance constraint so we don't double-count noise as beats.
    const minPeakDistanceMs = 350; // ~171 BPM max physiological cap
    const peaks = [];
    const mean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;
    const std = Math.sqrt(smoothed.reduce((a, b) => a + (b - mean) ** 2, 0) / smoothed.length);
    const prominenceThreshold = std * 0.3;

    for (let i = 2; i < smoothed.length - 2; i++) {
      const isLocalMax = smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i - 2]
        && smoothed[i] > smoothed[i + 1] && smoothed[i] > smoothed[i + 2];
      const hasProminence = (smoothed[i] - mean) > prominenceThreshold;

      if (isLocalMax && hasProminence) {
        const t = raw[i].t;
        const lastPeak = peaks[peaks.length - 1];
        if (!lastPeak || (t - lastPeak) >= minPeakDistanceMs) {
          peaks.push(t);
        }
      }
    }

    // 3. Need a reasonable number of beats to trust the result
    if (peaks.length < 5) {
      setStatusText('Signal too weak or irregular. Reposition your finger and retry.');
      setSignalQuality('Low');
      setShowResults(false);
      return;
    }

    // 4. Average interval between consecutive peaks -> BPM
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const calculatedBpm = Math.round(60000 / avgIntervalMs);

    // 5. Sanity-bound to plausible human resting/active range; otherwise flag low confidence
    const plausible = calculatedBpm >= 40 && calculatedBpm <= 200;

    // 6. Quality score from consistency of intervals (lower variance = better)
    const intervalStd = Math.sqrt(
      intervals.reduce((a, b) => a + (b - avgIntervalMs) ** 2, 0) / intervals.length
    );
    const consistency = intervalStd / avgIntervalMs; // lower is better
    let quality = 'Good';
    if (consistency > 0.25) quality = 'Fair';
    if (consistency > 0.4) quality = 'Low';

    if (!plausible || quality === 'Low') {
      setStatusText('Signal inconsistent — for an accurate reading, hold still and retry.');
      setSignalQuality(quality);
      setShowResults(false);
      return;
    }

    setBpm(calculatedBpm.toString());
    setSignalQuality(quality);
    setShowResults(true);
    setStatusText('Reading captured.');
  };

  const movingAverage = (arr, windowSize) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(arr.length, i + windowSize + 1);
      const slice = arr.slice(start, end);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    return result;
  };

  return (
    <div style={styles.card}>
      <div style={styles.kicker}>MANIFIX · HEART RATE</div>
      <div style={styles.header}>PULSE SCAN</div>
      <div style={styles.subHeader}>
        Cover your rear camera lens and flash completely with your fingertip — not too tight.
      </div>

      <button
        onClick={startCapture}
        disabled={isCapturing}
        style={{ ...styles.pulseTrigger, ...(isCapturing ? styles.pulseTriggerActive : {}) }}
      >
        {isCapturing ? `${Math.round(progress)}%` : 'START SCAN'}
      </button>

      <div style={styles.statusText}>{statusText}</div>

      <div style={{ ...styles.visualizerContainer, display: isCapturing || showResults ? 'block' : 'none' }}>
        <canvas ref={waveCanvasRef} style={styles.canvas}></canvas>
      </div>

      <div style={{ ...styles.resultsGrid, display: showResults ? 'grid' : 'none' }}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Heart Rate</div>
          <div style={styles.metricValue}>
            {bpm} <span style={styles.metricUnit}>BPM</span>
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Signal Quality</div>
          <div style={styles.metricValueSmall}>{signalQuality}</div>
        </div>
      </div>

      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
      <canvas ref={bufferCanvasRef} width="48" height="48" style={{ display: 'none' }}></canvas>

      <div style={styles.disclaimer}>
        Estimated pulse rate from camera-based light reflectance. For wellness reference only —
        not a medical device and not a substitute for clinical measurement.
      </div>
    </div>
  );
};

const styles = {
  card: {
    maxWidth: '420px',
    margin: '0 auto',
    backgroundColor: BLACK,
    border: `1px solid ${GOLD_DEEP}40`,
    borderRadius: '20px',
    padding: '28px 24px',
    boxShadow: '0 0 40px rgba(255, 200, 60, 0.06), 0 10px 30px rgba(0,0,0,0.6)',
    textAlign: 'center',
    color: '#fafafa',
    fontFamily: '"DM Mono", monospace'
  },
  kicker: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '12px',
    letterSpacing: '0.25em',
    color: GOLD_DEEP,
    marginBottom: '4px'
  },
  header: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '32px',
    letterSpacing: '0.05em',
    color: GOLD,
    marginBottom: '10px'
  },
  subHeader: { fontSize: '13px', color: '#a1a1aa', marginBottom: '22px', lineHeight: 1.5 },
  pulseTrigger: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    background: `radial-gradient(circle at 35% 30%, ${GOLD}, ${GOLD_DEEP})`,
    border: `3px solid ${BLACK}`,
    color: BLACK,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '17px',
    letterSpacing: '0.05em',
    fontWeight: 700,
    cursor: 'pointer',
    margin: '12px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(255, 200, 60, 0.45)',
    outline: 'none',
    transition: 'transform 0.15s ease'
  },
  pulseTriggerActive: {
    background: '#1c1c1c',
    color: GOLD,
    border: `3px solid ${GOLD_DEEP}`,
    boxShadow: '0 0 20px rgba(255, 200, 60, 0.2)',
    cursor: 'not-allowed'
  },
  statusText: { fontSize: '13px', color: GOLD_DEEP, margin: '14px 0', minHeight: '20px', lineHeight: 1.4 },
  visualizerContainer: {
    width: '100%',
    height: '110px',
    backgroundColor: '#0f0f0f',
    borderRadius: '10px',
    border: `1px solid ${GOLD_DEEP}30`,
    margin: '16px 0',
    overflow: 'hidden'
  },
  canvas: { width: '100%', height: '100%' },
  resultsGrid: { gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '18px' },
  metricCard: {
    backgroundColor: '#121212',
    padding: '16px',
    borderRadius: '14px',
    border: `1px solid ${GOLD_DEEP}40`,
    textAlign: 'left'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '4px'
  },
  metricValue: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', color: GOLD },
  metricUnit: { fontSize: '13px', color: GOLD_DEEP },
  metricValueSmall: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: GOLD },
  disclaimer: { fontSize: '10.5px', color: '#6b6b6b', marginTop: '22px', lineHeight: '1.5' }
};

export default PulseVisualizer;
