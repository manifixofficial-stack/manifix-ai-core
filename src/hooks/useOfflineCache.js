import { useCallback, useState } from "react";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = "info") => {
    const id = Date.now();

    setNotifications((prev) => [
      ...prev,
      { id, message, type },
    ]);

    // auto dismiss (UX-safe)
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      );
    }, 4000);
  }, []);

  return {
    notifications,
    notify,
  };
}
