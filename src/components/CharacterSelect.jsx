import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';

const SLOTS = [
  { key: 'BLUE', color: '#3a86ff', label: 'BLUE' },
  { key: 'PURPLE', color: '#8338ec', label: 'PURPLE' },
  { key: 'PINK', color: '#ff006e', label: 'PINK' },
  { key: 'ORANGE', color: '#fb5607', label: 'ORANGE' }
];

// Keep captured faces small — this is what stops the bandwidth problem described above.
// 96x96 JPEG at 0.7 quality lands around 3-6KB, and it's sent exactly once per player,
// not on every tick.
const FACE_CAPTURE_SIZE = 96;
const FACE_JPEG_QUALITY = 0.7;

function CharacterSelect({ roomCode, onJoined }) {
  const [taken, setTaken] = useState({ BLUE: false, PURPLE: false, PINK: false, ORANGE: false });
  const [nameInputs, setNameInputs] = useState({ BLUE: '', PURPLE: '', PINK: '', ORANGE: '' });
  const [claimingSlot, setClaimingSlot] = useState(null); // slot key currently mid-claim
  const [errorMsg, setErrorMsg] = useState('');

  // Face capture state
  const [faceDataUrl, setFaceDataUrl] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    socket.emit('request-characters');

    const handleCharactersUpdate = (data) => {
      setTaken(data.taken);
    };
    const handleCharacterError = (data) => {
      setErrorMsg(data.message || 'Could not claim that slot.');
      setClaimingSlot(null);
      setTimeout(() => setErrorMsg(''), 2500);
    };
    const handleGameJoined = (data) => {
      if (data.success) {
        onJoined && onJoined(data.character);
      }
    };

    socket.on('characters-update', handleCharactersUpdate);
    socket.on('character-error', handleCharacterError);
    socket.on('game-joined', handleGameJoined);

    return () => {
      socket.off('characters-update', handleCharactersUpdate);
      socket.off('character-error', handleCharacterError);
      socket.off('game-joined', handleGameJoined);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const openCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Front-facing camera specifically for a face capture — separate from any
      // rear-camera AR background stream elsewhere in the app.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 320 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (err) {
      console.error('Face camera blocked:', err);
      setCameraError('Camera access denied or unavailable. You can still play with a letter avatar.');
    }
  }, []);

  const snapFace = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = FACE_CAPTURE_SIZE;
    canvas.height = FACE_CAPTURE_SIZE;
    const ctx = canvas.getContext('2d');

    // Center-crop the video frame to a square before downscaling to FACE_CAPTURE_SIZE
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropSize = Math.min(vw, vh);
    const sx = (vw - cropSize) / 2;
    const sy = (vh - cropSize) / 2;

    ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, FACE_CAPTURE_SIZE, FACE_CAPTURE_SIZE);
    const dataUrl = canvas.toDataURL('image/jpeg', FACE_JPEG_QUALITY);
    setFaceDataUrl(dataUrl);
    stopCamera();
  }, []);

  const retakeFace = () => {
    setFaceDataUrl(null);
    openCamera();
  };

  const handleClaim = (slotKey) => {
    const name = (nameInputs[slotKey] || '').trim();
    if (!name) {
      setErrorMsg('Enter a name before claiming a slot.');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }

    setClaimingSlot(slotKey);
    socket.emit('join-game', { character: slotKey, name });

    // Face is sent ONCE via its own dedicated event, deliberately kept out of the
    // 22Hz game-state tick loop. If no face was captured, the server/client just
    // falls back to the existing colored-letter avatar — nothing breaks.
    if (faceDataUrl) {
      socket.emit('set-face', { faceUrl: faceDataUrl });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.faceCaptureCard}>
        <div style={styles.facePreviewWrap}>
          {cameraOpen && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.videoPreview}
            />
          )}
          {!cameraOpen && faceDataUrl && (
            <img src={faceDataUrl} alt="Your captured face" style={styles.facePreviewImg} />
          )}
          {!cameraOpen && !faceDataUrl && (
            <div style={styles.faceholder}>?</div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {cameraError && <div style={styles.errorText}>{cameraError}</div>}

        <div style={styles.faceButtonRow}>
          {!cameraOpen && !faceDataUrl && (
            <button style={styles.faceBtn} onClick={openCamera}>📷 CAPTURE FACE</button>
          )}
          {cameraOpen && (
            <button style={styles.faceBtnGold} onClick={snapFace}>✓ SNAP</button>
          )}
          {!cameraOpen && faceDataUrl && (
            <button style={styles.faceBtnSecondary} onClick={retakeFace}>↻ RETAKE</button>
          )}
        </div>
      </div>

      {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

      <div style={styles.grid}>
        {SLOTS.map((slot) => {
          const isTaken = taken[slot.key];
          const isClaiming = claimingSlot === slot.key;
          return (
            <div
              key={slot.key}
              style={{
                ...styles.slot,
                borderColor: slot.color,
                boxShadow: `0 0 14px ${slot.color}55`
              }}
            >
              {isTaken ? (
                <div style={styles.lockedPlate}>
                  <span style={styles.lockedText}>IN GAME</span>
                </div>
              ) : (
                <>
                  <input
                    style={styles.nameInput}
                    placeholder="ENTER YOUR NAME"
                    maxLength={12}
                    value={nameInputs[slot.key]}
                    onChange={(e) =>
                      setNameInputs((prev) => ({ ...prev, [slot.key]: e.target.value }))
                    }
                  />
                  <button
                    style={{ ...styles.claimBtn, backgroundColor: slot.color }}
                    onClick={() => handleClaim(slot.key)}
                    disabled={isClaiming}
                  >
                    {isClaiming ? '...' : 'CLAIM'}
                  </button>
                </>
              )}
              <span style={{ ...styles.slotLabel, color: slot.color }}>{slot.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    zIndex: 10
  },
  faceCaptureCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(8,8,10,0.6)',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  facePreviewWrap: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #ffc83c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111'
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)' // mirror front camera, feels natural for a selfie
  },
  facePreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  faceholder: {
    color: '#666',
    fontSize: '28px',
    fontFamily: 'monospace'
  },
  faceButtonRow: {
    display: 'flex',
    gap: '10px'
  },
  faceBtn: {
    background: 'transparent',
    border: '1px solid #ffc83c',
    color: '#ffc83c',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  },
  faceBtnGold: {
    background: '#ffc83c',
    border: 'none',
    color: '#08080a',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  },
  faceBtnSecondary: {
    background: 'transparent',
    border: '1px solid #666',
    color: '#aaa',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '11px',
    textAlign: 'center'
  },
  errorBanner: {
    background: 'rgba(220,38,38,0.15)',
    border: '1px solid rgba(220,38,38,0.5)',
    color: '#ff6b6b',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    textAlign: 'center'
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  slot: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(8,8,10,0.55)',
    border: '2px solid',
    borderRadius: '12px',
    padding: '10px 14px',
    position: 'relative'
  },
  slotLabel: {
    marginLeft: 'auto',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: '1px'
  },
  nameInput: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    padding: '8px 10px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
  },
  claimBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  },
  lockedPlate: {
    flex: 1,
    background: '#1c1c24',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lockedText: {
    color: '#dc2626',
    fontWeight: '900',
    fontSize: '13px',
    letterSpacing: '1px',
    fontFamily: 'monospace'
  }
};

export default CharacterSelect;
