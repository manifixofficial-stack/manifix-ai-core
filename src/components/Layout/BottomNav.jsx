import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icons from "../../assets/icons";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/app/dashboard", label: "Home", icon: Icons.home },
    { path: "/app/magic16", label: "Magic16", icon: Icons.magic16 },
    { path: "/app/profile", label: "Profile", icon: Icons.profile },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      
      {/* Floating Glass Dock */}
      <div className="
        relative
        w-[95%]
        max-w-md
        mb-4
        px-6
        py-3
        flex
        items-center
        justify-between
        rounded-3xl
        backdrop-blur-2xl
        bg-white/80
        dark:bg-zinc-900/80
        border border-white/40
        dark:border-zinc-700/40
        shadow-[0_10px_40px_rgba(0,0,0,0.15)]
      ">

        {/* Left Items */}
        {navItems.slice(0, 1).map((item) => (
          <NavItem key={item.path} item={item} active={isActive(item.path)} />
        ))}

        {navItems.slice(1, 2).map((item) => (
          <NavItem key={item.path} item={item} active={isActive(item.path)} />
        ))}

        {/* Center Floating GPT Button */}
        <button
          onClick={() => navigate("/app/gpt")}
          className="
            absolute
            -top-8
            left-1/2
            -translate-x-1/2
            h-16
            w-16
            rounded-full
            bg-gradient-to-br
            from-indigo-600
            to-indigo-500
            shadow-[0_8px_25px_rgba(79,70,229,0.6)]
            flex
            items-center
            justify-center
            transition-all
            duration-300
            hover:scale-110
            active:scale-95
          "
        >
          <img
            src={Icons.chat}
            alt="GPT"
            className="h-7 w-7 brightness-0 invert"
          />
        </button>

        {/* Right Item */}
        {navItems.slice(2).map((item) => (
          <NavItem key={item.path} item={item} active={isActive(item.path)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ item, active }) {
  return (
    <NavLink
      to={item.path}
      className="relative flex flex-col items-center text-xs transition-all duration-300"
    >
      {/* Glow Effect */}
      {active && (
        <span className="
          absolute
          -inset-2
          rounded-xl
          bg-indigo-500/10
          blur-md
        " />
      )}

      <img
        src={item.icon}
        alt={item.label}
        className={`h-6 w-6 relative z-10 transition-all duration-300 ${
          active
            ? "opacity-100 scale-110"
            : "opacity-60 dark:opacity-70"
        }`}
      />

      <span
        className={`mt-1 text-[11px] relative z-10 ${
          active
            ? "text-indigo-600 dark:text-indigo-400 font-semibold"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {item.label}
      </span>
    </NavLink>
  );
}
