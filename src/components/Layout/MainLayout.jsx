import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css";

export default function MainLayout() {

const navigate = useNavigate();
const location = useLocation();

const [sidebarOpen, setSidebarOpen] = useState(true);

return (

```
<div className="app-container">

  {/* TOP BAR */}

  <header className="topbar">

    <div className="topbar-left">
      <button
        className="menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <h1
        className="logo"
        onClick={() => navigate("/")}
      >
        ManifiX
      </h1>
    </div>

    <div className="topbar-center">

      <input
        className="search"
        placeholder="Search chats..."
      />

    </div>

    <div className="topbar-right">

      <button className="icon-btn">
        🎤
      </button>

      <button className="icon-btn">
        🔔
      </button>

      <button className="profile-btn">
        👤
      </button>

    </div>

  </header>


  <div className="layout-body">

    {/* SIDEBAR */}

    {sidebarOpen && (

      <aside className="sidebar">

        <button
          className="new-chat"
          onClick={() => navigate("/gpt")}
        >
          + New Chat
        </button>

        <nav className="sidebar-nav">

          <button
            className={location.pathname === "/gpt" ? "active" : ""}
            onClick={() => navigate("/gpt")}
          >
            💬 Chats
          </button>

          <button
            className={location.pathname === "/magic16" ? "active" : ""}
            onClick={() => navigate("/magic16")}
          >
            ✨ Magic16
          </button>

          <button
            onClick={() => navigate("/dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => navigate("/journal")}
          >
            📓 Journal
          </button>

          <button
            onClick={() => navigate("/settings")}
          >
            ⚙ Settings
          </button>

        </nav>

      </aside>

    )}


    {/* MAIN WORKSPACE */}

    <main className="workspace">

      <Outlet />

    </main>

  </div>

</div>
```

);

}
