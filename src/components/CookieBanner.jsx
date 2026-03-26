import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setShow(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      width: "100%",
      background: "#111",
      color: "#fff",
      padding: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 9999
    }}>
      <span>
        We use cookies to improve your experience. By using ManifiX, you agree to our Privacy Policy.
      </span>

      <button
        onClick={acceptCookies}
        style={{
          background: "#00ffcc",
          border: "none",
          padding: "8px 16px",
          cursor: "pointer",
          borderRadius: "5px"
        }}
      >
        Allow
      </button>
    </div>
  );
}
