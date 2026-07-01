import { io } from 'socket.io-client';

// Forcing the real direct link to completely bypass Vercel panel cache walls!
const SERVER_URL = 'https://manifix-ai-core.onrender.com';

export const socket = io(SERVER_URL, {
  autoConnect: false, // Wait until the player submits a room code to connect
  transports: ['websocket'], // Forces clean, ultra-low lag inputs
});
