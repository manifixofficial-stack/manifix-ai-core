import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function FloatingButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/vibe/create")}
      className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition"
    >
      <FiPlus size={26} />
    </button>
  );
}
