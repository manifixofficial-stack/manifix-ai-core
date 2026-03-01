import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icons from "../../assets/icons";

const navItems = [
  { path: "/app/dashboard", label: "Home", icon: Icons.home },
  { path: "/app/magic16", label: "Magic16", icon: Icons.magic16 },
  { path: "/app/gpt", label: "GPT", icon: Icons.chat },
  { path: "/app/profile", label: "Profile", icon: Icons.profile },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-white/90 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center h-16 px-4 pb-safe">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center text-xs transition-all duration-300"
              >
                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute top-0 h-1 w-8 rounded-full bg-indigo-600" />
                )}

                <img
                  src={item.icon}
                  alt={item.label}
                  className={`h-6 w-6 transition-all duration-300 ${
                    isActive ? "opacity-100 scale-110" : "opacity-60"
                  }`}
                />

                <span
                  className={`mt-1 text-[11px] ${
                    isActive
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
