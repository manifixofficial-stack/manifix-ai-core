import { io } from 'socket.io-client';

// Automatically reads your Vercel Environment Variable, defaults to local port 5000
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const socket = io(SERVER_URL, {
  autoConnect: false, // Wait until the player submits a room code to connect
  transports: ['websocket'], // Forces clean, ultra-low lag inputs
});
