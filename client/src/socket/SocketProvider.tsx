import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { z } from 'zod';
import { readAuthToken } from '../api/client';

type BoardCard = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position?: number;
  dueDate?: string | null;
  assigneeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BoardList = {
  id: string;
  boardId?: string;
  title: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
  cards: BoardCard[];
};

type Board = {
  id: string;
  title: string;
  description: string | null;
  lists: BoardList[];
};

type PresenceUser = { userId: string; name: string; email: string; activeCardId: string | null };
type ConnectionStatus = 'connected' | 'reconnecting';
const PresenceContext = createContext<{ users: PresenceUser[]; status: ConnectionStatus }>({ users: [], status: 'reconnecting' });

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;
const listSchema = z.object({ id: z.string(), title: z.string(), position: z.number().optional() }).passthrough();
const cardSchema = z.object({ id: z.string(), listId: z.string(), title: z.string(), description: z.string().nullable().optional(), position: z.number().optional() }).passthrough();
const listCreatedSchema = z.object({ boardId: z.string(), list: listSchema });
const listUpdatedSchema = z.object({ boardId: z.string(), list: listSchema });
const listDeletedSchema = z.object({ boardId: z.string(), listId: z.string() });
const cardCreatedSchema = z.object({ boardId: z.string(), listId: z.string(), card: cardSchema });
const cardUpdatedSchema = z.object({ boardId: z.string(), card: cardSchema });
const cardMovedSchema = z.object({ boardId: z.string(), cardId: z.string(), sourceListId: z.string(), targetListId: z.string(), position: z.number(), updatedAt: z.string() });
const cardDeletedSchema = z.object({ boardId: z.string(), listId: z.string(), cardId: z.string() });
const presenceUserSchema = z.object({ userId: z.string(), name: z.string(), email: z.string(), activeCardId: z.string().nullable() });
const joinAcknowledgmentSchema = z.object({ success: z.boolean(), boardId: z.string().optional(), activeUsers: z.array(presenceUserSchema).optional() });
const presenceUpdateSchema = z.object({ boardId: z.string(), userId: z.string(), name: z.string(), status: z.enum(['online', 'offline']), cardId: z.string().nullable() });

function sortedByPosition<T extends { position?: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
}

function updateBoardCache(queryClient: ReturnType<typeof useQueryClient>, boardId: string, update: (board: Board) => Board): void {
  queryClient.setQueryData<Board>(['board', boardId], (board) => board ? update(board) : board);
}

export function SocketProvider({ boardId, enabled, children }: { boardId: string | undefined; enabled: boolean; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('reconnecting');

  useEffect(() => {
    const token = readAuthToken();
    if (!enabled || !boardId || !token) return;

    const socket = io(socketUrl, { auth: { token }, autoConnect: false });
    let connectedBefore = false;
    socket.on('connect', () => {
      const isReconnect = connectedBefore;
      connectedBefore = true;
      setStatus('connected');
      socket.emit('board:join', { boardId }, (response: unknown) => {
        const parsed = joinAcknowledgmentSchema.safeParse(response);
        if (parsed.success && parsed.data.success && parsed.data.boardId === boardId) setUsers(parsed.data.activeUsers ?? []);
      });
      if (isReconnect) void queryClient.refetchQueries({ queryKey: ['board', boardId], exact: true });
    });
    socket.on('disconnect', () => setStatus('reconnecting'));
    socket.on('connect_error', () => setStatus('reconnecting'));
    socket.on('presence:update', (payload: unknown) => {
      const parsed = presenceUpdateSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      setUsers((current) => {
        if (parsed.data.status === 'offline') return current.filter((user) => user.userId !== parsed.data.userId);
        const online = { userId: parsed.data.userId, name: parsed.data.name, email: '', activeCardId: parsed.data.cardId };
        return current.some((user) => user.userId === online.userId)
          ? current.map((user) => user.userId === online.userId ? { ...user, ...online, email: user.email } : user)
          : [...current, online];
      });
    });

    socket.on('list:created', (payload: unknown) => {
      const parsed = listCreatedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      const incoming = { ...parsed.data.list, cards: [] } as BoardList;
      updateBoardCache(queryClient, boardId, (board) => {
        if (board.lists.some((list) => list.id === incoming.id)) return board;
        const optimisticIndex = board.lists.findIndex((list) => list.id.startsWith('new-') && list.title === incoming.title);
        const lists = [...board.lists];
        if (optimisticIndex >= 0) lists[optimisticIndex] = incoming;
        else lists.push(incoming);
        return { ...board, lists: sortedByPosition(lists) };
      });
    });

    socket.on('list:updated', (payload: unknown) => {
      const parsed = listUpdatedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      updateBoardCache(queryClient, boardId, (board) => ({
        ...board,
        lists: sortedByPosition(board.lists.map((list) => list.id === parsed.data.list.id ? { ...list, ...parsed.data.list } : list)),
      }));
    });

    socket.on('list:deleted', (payload: unknown) => {
      const parsed = listDeletedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      updateBoardCache(queryClient, boardId, (board) => ({ ...board, lists: board.lists.filter((list) => list.id !== parsed.data.listId) }));
    });

    socket.on('card:created', (payload: unknown) => {
      const parsed = cardCreatedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      const incoming = parsed.data.card as BoardCard;
      updateBoardCache(queryClient, boardId, (board) => ({
        ...board,
        lists: board.lists.map((list) => {
          if (list.id !== parsed.data.listId || list.cards.some((card) => card.id === incoming.id)) return list;
          const optimisticIndex = list.cards.findIndex((card) => card.id.startsWith('new-') && card.title === incoming.title);
          const cards = [...list.cards];
          if (optimisticIndex >= 0) cards[optimisticIndex] = incoming;
          else cards.push(incoming);
          return { ...list, cards: sortedByPosition(cards) };
        }),
      }));
    });

    socket.on('card:updated', (payload: unknown) => {
      const parsed = cardUpdatedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      const incoming = parsed.data.card as BoardCard;
      updateBoardCache(queryClient, boardId, (board) => ({
        ...board,
        lists: board.lists.map((list) => ({ ...list, cards: list.cards.map((card) => card.id === incoming.id ? { ...card, ...incoming } : card) })),
      }));
    });

    socket.on('card:moved', (payload: unknown) => {
      const parsed = cardMovedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      updateBoardCache(queryClient, boardId, (board) => {
        let moved: BoardCard | undefined;
        const sourceFiltered = board.lists.map((list) => ({
          ...list,
          cards: list.cards.filter((card) => {
            if (card.id !== parsed.data.cardId) return true;
            moved = { ...card, listId: parsed.data.targetListId, position: parsed.data.position, updatedAt: parsed.data.updatedAt };
            return false;
          }),
        }));
        if (!moved) return board;
        return {
          ...board,
          lists: sourceFiltered.map((list) => list.id === parsed.data.targetListId
            ? { ...list, cards: sortedByPosition([...list.cards.filter((card) => card.id !== moved?.id), moved as BoardCard]) }
            : list),
        };
      });
    });

    socket.on('card:deleted', (payload: unknown) => {
      const parsed = cardDeletedSchema.safeParse(payload);
      if (!parsed.success || parsed.data.boardId !== boardId) return;
      updateBoardCache(queryClient, boardId, (board) => ({
        ...board,
        lists: board.lists.map((list) => list.id === parsed.data.listId ? { ...list, cards: list.cards.filter((card) => card.id !== parsed.data.cardId) } : list),
      }));
    });

    socket.connect();
    return () => {
      socket.emit('board:leave', { boardId });
      socket.disconnect();
      setUsers([]);
      setStatus('reconnecting');
    };
  }, [boardId, enabled, queryClient]);

  return <PresenceContext.Provider value={{ users, status }}>{children}</PresenceContext.Provider>;
}

export function BoardPresence() {
  const { users, status } = useContext(PresenceContext);
  const names = users.map((user) => user.name).join(', ');
  return <div className="flex items-center gap-3">
    <div aria-label={`Online: ${names || 'no other collaborators'}`} className="flex -space-x-[5px]" title={names || 'No other collaborators online'}>
      {users.map((user) => <span aria-label={`${user.name} is online`} className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-ink/20 bg-surface font-mono text-[10px] font-bold text-ink" key={user.userId} role="img" title={user.name}>
        {user.name.slice(0, 2).toUpperCase()}<span aria-hidden="true" className="absolute -bottom-px -right-px h-[5px] w-[5px] rounded-full border border-surface bg-success" />
      </span>)}
    </div>
    <span aria-live="polite" className="flex items-center gap-1.5 font-mono text-[10px] text-muted" role="status"><span aria-hidden="true" className={`h-[5px] w-[5px] rounded-full ${status === 'connected' ? 'bg-success' : 'bg-muted'}`} />{status}</span>
  </div>;
}
