import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinExecutionRoom(executionId: string): void {
  const s = getSocket();
  s.emit('join-execution', executionId);
}

export function leaveExecutionRoom(executionId: string): void {
  const s = getSocket();
  s.emit('leave-execution', executionId);
}
