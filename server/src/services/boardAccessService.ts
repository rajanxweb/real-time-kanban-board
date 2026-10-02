import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function isBoardMember(
  boardId: string,
  userId: string,
): Promise<boolean> {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { id: true },
  });

  return membership !== null;
}

export async function isBoardOwner(
  boardId: string,
  userId: string,
): Promise<boolean> {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true },
  });

  return membership?.role === Role.OWNER;
}

export async function boardExists(boardId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true },
  });

  return board !== null;
}
