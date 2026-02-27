export default function useVoiceCommands() {
  const commands = {
    "start magic16": () => "magic16",
    "open profile": () => "profile",
    "go to vibe": () => "vibe",
    "start meditation": () => "meditation",
  };

  const matchCommand = (text) => {
    const normalized = text.toLowerCase();

    for (const key in commands) {
      if (normalized.includes(key)) {
        return commands[key]();
      }
    }

    return null;
  };

  return { matchCommand };
}
