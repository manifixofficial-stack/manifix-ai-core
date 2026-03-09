import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/app/dashboard",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      ),
    },
    {
      name: "GPT AI",
      path: "/app/gpt",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 2L2 7v7c0 5 4 9 9 9s9-4 9-9V7l-10-5z"/>
        </svg>
      ),
    },
    {
      name: "Magic16",
      path: "/app/magic16",
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
    },
    {
      name: "Feedback",
      path: "/app/feedback",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 6h-2V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2H3v14h18V6z"/>
        </svg>
      ),
    },
    {
      name: "Billing",
      path: "/app/billing",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M2 4v16h20V4H2zm18 14H4V6h16v12z"/>
        </svg>
      ),
    }
  ];

  return (
    <div className={`chatgpt-layout ${sidebarOpen ? "open" : "closed"}`}>

      {/* Sidebar */}
      <aside className="chatgpt-sidebar">

        <div className="sidebar-header">

          {/* Toggle Button */}
          <button className="menu-toggle" onClick={toggleSidebar}>
            =
          </button>

          <img src={logo} alt="ManifiX Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">ManifiX</h1>

        </div>

        <nav className="sidebar-nav">

          {navItems.map((item) => (

            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >

              <span className="active-bar" />

              <span className="link-icon">
                {item.icon}
              </span>

              <span className="link-text">
                {item.name}
              </span>

            </NavLink>

          ))}

        </nav>

      </aside>

      {/* Main Content */}
      <main className="chatgpt-main">
        <Outlet />
      </main>

    </div>
  );
}
