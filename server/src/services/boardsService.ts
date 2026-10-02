import { Role } from '@prisma/client';
import { AppError } from '../lib/AppError.js';
import { prisma } from '../lib/prisma.js';
import type {
  CreateBoardBody,
  UpdateBoardBody,
} from '../validators/boards.js';

export async function createBoard(userId: string, input: CreateBoardBody) {
  const board = await prisma.board.create({
    data: {
      title: input.title,
      description: input.description,
      members: { create: { userId, role: Role.OWNER } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ...board, role: Role.OWNER };
}

export async function listUserBoards(userId: string) {
  const memberships = await prisma.boardMember.findMany({
    where: { userId },
    orderBy: { board: { updatedAt: 'desc' } },
    select: {
      role: true,
      board: {
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return memberships.map(({ role, board }) => ({ ...board, role }));
}

export async function getBoard(boardId: string, userId: string) {
  const [board, membership] = await Promise.all([
    prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { name: true, email: true } },
          },
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    }),
    prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
      select: { role: true },
    }),
  ]);

  if (!board) {
    throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
  }

  if (!membership) {
    throw new AppError(
      'You are not a member of this board',
      403,
      'ACCESS_DENIED',
    );
  }

  return {
    id: board.id,
    title: board.title,
    description: board.description,
    currentUserRole: membership.role,
    members: board.members.map(({ user, ...member }) => ({
      ...member,
      name: user.name,
      email: user.email,
    })),
    lists: board.lists,
  };
}

export async function updateBoard(boardId: string, input: UpdateBoardBody) {
  return prisma.board.update({
    where: { id: boardId },
    data: input,
    select: {
      id: true,
      title: true,
      description: true,
      updatedAt: true,
    },
  });
}

export async function deleteBoard(boardId: string): Promise<void> {
  await prisma.board.delete({ where: { id: boardId } });
}
