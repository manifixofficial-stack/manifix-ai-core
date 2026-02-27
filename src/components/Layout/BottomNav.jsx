import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Home", icon: "🏠" },
  { path: "/magic16", label: "Magic16", icon: "✨" },
  { path: "/gpt", label: "GPT", icon: "🤖" },
  { path: "/vibe", label: "Vibe", icon: "🌊" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

const BottomNav = () => {
  return (
    <nav style={styles.nav}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            ...styles.link,
            color: isActive ? "#6366f1" : "#6b7280",
            fontWeight: isActive ? 600 : 500,
          })}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span style={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

const styles = {
  nav: {
    position: "fixed",
    bottom: 0,
    width: "100%",
    height: "70px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    backdropFilter: "blur(15px)",
    background: "rgba(255,255,255,0.9)",
    borderTop: "1px solid #e5e7eb",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  link: {
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "0.75rem",
    transition: "all 0.2s ease",
  },
  icon: {
    fontSize: "1.4rem",
    marginBottom: "2px",
  },
  label: {
    fontSize: "0.7rem",
  },
};

export default BottomNav;
