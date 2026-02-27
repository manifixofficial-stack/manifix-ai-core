import { useMemo } from "react";

export default function useQuickReplies(context = "default") {
  const replies = useMemo(() => {
    if (context === "motivation") {
      return [
        "Help me focus",
        "Give me motivation",
        "What should I do next?",
      ];
    }

    if (context === "health") {
      return [
        "Start Magic16",
        "Give a health tip",
        "Guide meditation",
      ];
    }

    return [
      "Tell me more",
      "Explain simply",
      "Give an example",
    ];
  }, [context]);

  return { replies };
}
