import { useCallback } from "react";

export default function useErrorHandler() {
  const handleError = useCallback((error, fallback = "Something went wrong") => {
    if (!error) return fallback;

    if (typeof error === "string") return error;
    if (error.message) return error.message;

    return fallback;
  }, []);

  return {
    handleError,
  };
}
