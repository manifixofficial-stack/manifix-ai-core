import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../assets/icons";

export default function FloatingAIButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 z-50 flex items-center justify-center">

      {/* Radial Menu Items */}
      {open && (
        <>
          <RadialItem
            icon={Icons.microphone}
            label="Voice"
            onClick={() => navigate("/app/gpt?mode=voice")}
            position="top-20"
          />
          <RadialItem
            icon={Icons.magic16}
            label="Magic16"
            onClick={() => navigate("/app/magic16")}
            position="top-16 right-16"
          />
          <RadialItem
            icon={Icons.profile}
            label="Profile"
            onClick={() => navigate("/app/profile")}
            position="right-20"
          />
        </>
      )}

      {/* Main AI Orb */}
      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          h-16
          w-16
          rounded-full
          bg-gradient-to-br
          from-indigo-600
          to-indigo-500
          dark:from-indigo-500
          dark:to-indigo-400
          shadow-[0_12px_35px_rgba(79,70,229,0.6)]
          flex
          items-center
          justify-center
          transition-all
          duration-300
          hover:scale-110
          active:scale-95
        "
      >

        {/* Breathing Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-30 animate-ping" />

        {/* Notification Badge */}
        <span className="
          absolute
          -top-1
          -right-1
          h-5
          w-5
          text-[10px]
          bg-red-500
          text-white
          rounded-full
          flex
          items-center
          justify-center
          shadow-md
        ">
          3
        </span>

        {/* Icon */}
        <img
          src={Icons.chat}
          alt="AI"
          className="h-7 w-7 brightness-0 invert relative z-10"
        />
      </button>
    </div>
  );
}

function RadialItem({ icon, label, onClick, position }) {
  return (
    <button
      onClick={onClick}
      className={`
        absolute
        ${position}
        h-12
        w-12
        rounded-full
        bg-white
        dark:bg-zinc-800
        shadow-lg
        flex
        items-center
        justify-center
        transition-all
        duration-300
        hover:scale-110
      `}
    >
      <img src={icon} alt={label} className="h-5 w-5" />
    </button>
  );
}
