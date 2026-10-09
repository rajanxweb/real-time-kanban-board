import { useEffect, type ReactNode } from 'react';
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

function sortedByPosition<T extends { position?: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
}

function updateBoardCache(queryClient: ReturnType<typeof useQueryClient>, boardId: string, update: (board: Board) => Board): void {
  queryClient.setQueryData<Board>(['board', boardId], (board) => board ? update(board) : board);
}

export function SocketProvider({ boardId, enabled, children }: { boardId: string | undefined; enabled: boolean; children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = readAuthToken();
    if (!enabled || !boardId || !token) return;

    const socket = io(socketUrl, { auth: { token }, autoConnect: false });
    socket.on('connect', () => socket.emit('board:join', { boardId }));

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
    };
  }, [boardId, enabled, queryClient]);

  return children;
}
