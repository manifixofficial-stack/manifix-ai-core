/**
 * GameContext.jsx
 * Unified real-time state router for Veggie Go.
 *
 * Wraps the WebSocket tick stream (tickClient.js) and the Supabase RPC
 * layer (gameClient.js) behind a single context so components
 * (GameCanvas, Scoreboard, CharacterSelect, GameARView, etc.) don't talk
 * to either client directly.
 *
 * ASSUMPTIONS — adjust the import paths / method names below to match
 * your actual gameClient.js and tickClient.js exports if they differ:
 *   - tickClient: connect(roomId, playerId), disconnect(), on(event, cb),
 *                 off(event, cb), send(type, payload)
 *   - gameClient: claimCharacter(roomId, playerId, colorSlot),
 *                 captureVeggie(roomId, veggieId, playerId),
 *                 setLobbySize(roomId, size)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { tickClient } from "../lib/tickClient";
import { gameClient } from "../lib/gameClient";

const GameContext = createContext(null);

const CONNECTION_STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

export function GameProvider({ roomId, playerId, children }) {
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS.IDLE
  );
  const [players, setPlayers] = useState({});
  const [veggies, setVeggies] = useState({});
  const [lobby, setLobby] = useState({
    size: null,
    targetSize: null,
    allSlotsFilled: false,
  });
  const [selfPosition, setSelfPosition] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);

  // ---- Tick stream lifecycle -------------------------------------------
  useEffect(() => {
    if (!roomId || !playerId) return undefined;

    setConnectionStatus(CONNECTION_STATUS.CONNECTING);

    const handleOpen = () => setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    const handleClose = () =>
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    const handleReconnecting = () =>
      setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
    const handleError = (err) => {
      setConnectionStatus(CONNECTION_STATUS.ERROR);
      setError(err);
    };

    const handleTick = (payload) => {
      if (payload.players) setPlayers(payload.players);
      if (payload.veggies) setVeggies(payload.veggies);
      if (payload.lobby) {
        setLobby({
          size: payload.lobby.size ?? null,
          targetSize: payload.lobby.target_size ?? payload.lobby.targetSize ?? null,
          allSlotsFilled:
            payload.lobby.all_slots_filled ??
            payload.lobby.allSlotsFilled ??
            false,
        });
      }
    };

    const handlePlayerPosition = (payload) => {
      if (payload.playerId === playerId) {
        setSelfPosition({ lat: payload.lat, lon: payload.lon });
      }
    };

    tickClient.on("open", handleOpen);
    tickClient.on("close", handleClose);
    tickClient.on("reconnecting", handleReconnecting);
    tickClient.on("error", handleError);
    tickClient.on("tick", handleTick);
    tickClient.on("player_position", handlePlayerPosition);

    tickClient.connect(roomId, playerId);
    clientRef.current = tickClient;

    return () => {
      tickClient.off("open", handleOpen);
      tickClient.off("close", handleClose);
      tickClient.off("reconnecting", handleReconnecting);
      tickClient.off("error", handleError);
      tickClient.off("tick", handleTick);
      tickClient.off("player_position", handlePlayerPosition);
      tickClient.disconnect();
      clientRef.current = null;
    };
  }, [roomId, playerId]);

  // ---- Device heading (compass) ------------------------------------------
  useEffect(() => {
    const handleOrientation = (evt) => {
      const heading =
        evt.webkitCompassHeading !== undefined
          ? evt.webkitCompassHeading
          : evt.alpha != null
          ? 360 - evt.alpha
          : null;
      if (heading != null) setDeviceHeading(heading);
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  // ---- Actions (delegate to gameClient RPCs) -----------------------------
  const claimCharacter = useCallback(
    async (colorSlot) => {
      try {
        return await gameClient.claimCharacter(roomId, playerId, colorSlot);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [roomId, playerId]
  );

  const captureVeggie = useCallback(
    async (veggieId) => {
      try {
        return await gameClient.captureVeggie(roomId, veggieId, playerId);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [roomId, playerId]
  );

  const setLobbySize = useCallback(
    async (size) => {
      try {
        return await gameClient.setLobbySize(roomId, size);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [roomId]
  );

  const sendPosition = useCallback(
    (lat, lon) => {
      tickClient.send("player_position", { roomId, playerId, lat, lon });
    },
    [roomId, playerId]
  );

  const value = useMemo(
    () => ({
      connectionStatus,
      players,
      veggies,
      lobby,
      selfPosition,
      deviceHeading,
      error,
      claimCharacter,
      captureVeggie,
      setLobbySize,
      sendPosition,
    }),
    [
      connectionStatus,
      players,
      veggies,
      lobby,
      selfPosition,
      deviceHeading,
      error,
      claimCharacter,
      captureVeggie,
      setLobbySize,
      sendPosition,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
}

export { CONNECTION_STATUS };
