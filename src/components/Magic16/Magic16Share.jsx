import { useState } from "react";
import "../../styles/magic16.css";

export default function Magic16Share({
  averageScore = 0,
  streak = 0
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `I just completed the Magic16 wellness session on ManifiX 🧘‍♂️

Posture Score: ${averageScore}%
Streak: ${streak} 🔥

Try the Magic16 challenge yourself!`;

  const shareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Magic16 Complete!",
          text: shareText,
          url: window.location.origin
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);

        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="magic16-share-wrapper">

      <h3 className="magic16-share-title">
        Share your achievement
      </h3>

      <p className="magic16-share-sub">
        Inspire others to try the Magic16 routine.
      </p>

      <button
        className="magic16-share-btn"
        onClick={shareApp}
      >
        {copied ? "Copied to Clipboard!" : "Share Result"}
      </button>

    </div>
  );
}
