import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(token?: string) {
  if (socket) return socket;
  const origin = process.env.NEXT_PUBLIC_WS_API_URL! ??  'https://api.settlerpay.com';
  const opts: any = { transports: ['websocket'] };
  socket = io(origin, opts);
  return socket;
}

export function getSocket() {
  return socket;
}

export default { initSocket, getSocket };
