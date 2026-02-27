import { useEffect, useRef, useState } from "react";

export default function useVoice() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.lang = "en-US";

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = (onResult) => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult?.(text);
    };

    setListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return {
    listening,
    startListening,
    stopListening,
  };
}
