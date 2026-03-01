import React from "react";
import { useAppSelector } from "@/store";

const TopBar = () => {
  const user = useAppSelector((state) => state.auth.user);

  const username =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Creator";

  return (
    <header style={styles.header}>
      {/* Left: Logo */}
      <div style={styles.left}>
        <h1 style={styles.logo}>ManifiX</h1>
      </div>

      {/* Right: User Info */}
      <div style={styles.right}>
        <span style={styles.username}>@{username}</span>
        <div style={styles.avatar}>
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    height: "64px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 1.5rem",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    borderBottom: "1px solid #e5e7eb",
    transition: "background 0.3s ease, box-shadow 0.3s ease",
    fontFamily: "'Inter', sans-serif",
  },
  logo: {
    fontSize: "1.6rem",
    fontWeight: 800,
    letterSpacing: "-1px",
    color: "#4f46e5", // vibrant, premium purple
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 0.2s ease",
  },
  left: {
    display: "flex",
    alignItems: "center",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
  },
  username: {
    fontSize: "0.9rem",
    color: "#6b7280",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
};

export default TopBar;
