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
      <div style={styles.left}>
        <h1 style={styles.logo}>ManifiX</h1>
      </div>

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
    height: "60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 1rem",
    backdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.8)",
    borderBottom: "1px solid #e5e7eb",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  username: {
    fontSize: "0.85rem",
    color: "#6b7280",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
};

export default TopBar;
