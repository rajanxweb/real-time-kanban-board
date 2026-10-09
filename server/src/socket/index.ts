import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getUserFromAccessToken } from '../services/authService.js';
import { isBoardMember } from '../services/boardAccessService.js';
import type { AuthUser } from '../types/auth.js';

declare module 'socket.io' {
  interface SocketData {
    user: AuthUser;
  }
}

const tokenSchema = z.string().min(1);
const boardPayloadSchema = z.object({ boardId: z.string().min(1) });
const roomName = (boardId: string) => `board:${boardId}`;

type JoinAcknowledgment = {
  success: boolean;
  boardId?: string;
  activeUsers?: Array<{ userId: string; name: string; email: string; activeCardId: null }>;
  error?: { code: string; message: string };
};

let socketServer: Server | undefined;

export function attachSocketServer(server: HttpServer): Server {
  const io = new Server(server, { cors: { origin: env.CLIENT_ORIGIN } });
  socketServer = io;

  io.use(async (socket, next) => {
    const parsedToken = tokenSchema.safeParse(socket.handshake.auth.token);
    if (!parsedToken.success) {
      next(new Error('Authentication failed: invalid token'));
      return;
    }

    try {
      socket.data.user = await getUserFromAccessToken(parsedToken.data);
      next();
    } catch {
      next(new Error('Authentication failed: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('board:join', async (payload: unknown, acknowledge?: (response: JoinAcknowledgment) => void) => {
      const parsed = boardPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        acknowledge?.({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A valid boardId is required' } });
        return;
      }

      try {
        const member = await isBoardMember(parsed.data.boardId, socket.data.user.id);
        if (!member) {
          acknowledge?.({ success: false, error: { code: 'ACCESS_DENIED', message: 'User is not a member of this board' } });
          return;
        }

        const room = roomName(parsed.data.boardId);
        await socket.join(room);
        const activeUsers = new Map<string, { userId: string; name: string; email: string; activeCardId: null }>();
        for (const connection of await io.in(room).fetchSockets()) {
          const user = connection.data.user;
          activeUsers.set(user.id, { userId: user.id, name: user.name, email: user.email, activeCardId: null });
        }
        acknowledge?.({ success: true, boardId: parsed.data.boardId, activeUsers: [...activeUsers.values()] });
      } catch {
        acknowledge?.({ success: false, error: { code: 'ACCESS_DENIED', message: 'User is not a member of this board' } });
      }
    });

    socket.on('board:leave', async (payload: unknown) => {
      const parsed = boardPayloadSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomName(parsed.data.boardId);
      try {
        const member = await isBoardMember(parsed.data.boardId, socket.data.user.id);
        if (member || socket.rooms.has(room)) await socket.leave(room);
      } catch {
        if (socket.rooms.has(room)) await socket.leave(room);
      }
    });
  });

  return io;
}

export function emitToBoard(event: string, boardId: string, payload: object): void {
  socketServer?.to(roomName(boardId)).emit(event, payload);
}
