import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(token?: string) {
  if (socket) return socket;
  const origin = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : '';
  const opts: any = { transports: ['websocket'] };
  socket = io(origin, opts);
  return socket;
}

export function getSocket() {
  return socket;
}

export default { initSocket, getSocket };
