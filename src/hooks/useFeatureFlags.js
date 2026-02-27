import { useMemo } from "react";

const defaultFlags = {
  vibeFeed: true,
  voiceInput: true,
  magic16: true,
  offlineMode: false,
  experimentalAI: false,
};

export default function useFeatureFlags(overrides = {}) {
  const flags = useMemo(() => {
    return { ...defaultFlags, ...overrides };
  }, [overrides]);

  const isEnabled = (key) => Boolean(flags[key]);

  return {
    flags,
    isEnabled,
  };
}
