import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function MobileLayout() {
  const location = useLocation();

  const fullScreenRoutes = ["/vision", "/magic16"];
  const isFullScreen = fullScreenRoutes.includes(location.pathname);

  return (
    <div className="app-shell">
      {!isFullScreen && <TopBar />}

      <main className="app-content">
        <Outlet />
      </main>

      {!isFullScreen && <BottomNav />}
    </div>
  );
}
const styles = {
 .app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0d0d0d;
  color: #fff;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
export default MobileLayout;
