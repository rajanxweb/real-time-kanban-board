import { Prisma, Role } from '@prisma/client';
import { AppError } from '../lib/AppError.js';
import { prisma } from '../lib/prisma.js';
import type { AddBoardMemberBody } from '../validators/boards.js';

export async function listBoardMembers(boardId: string) {
  const members = await prisma.boardMember.findMany({
    where: { boardId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      role: true,
      user: { select: { name: true, email: true } },
    },
  });

  return members.map(({ user, ...member }) => ({
    ...member,
    name: user.name,
    email: user.email,
  }));
}

export async function addBoardMember(
  boardId: string,
  input: AddBoardMemberBody,
) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('No user found with this email', 400, 'USER_NOT_FOUND');
  }

  const existingMembership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
    select: { id: true },
  });

  if (existingMembership) {
    throw new AppError(
      'User is already a member of this board',
      409,
      'MEMBER_ALREADY_EXISTS',
    );
  }

  try {
    return await prisma.boardMember.create({
      data: { boardId, userId: user.id, role: Role.MEMBER },
      select: {
        id: true,
        userId: true,
        role: true,
        user: { select: { name: true, email: true } },
      },
    }).then(({ user: memberUser, ...member }) => ({
      ...member,
      name: memberUser.name,
      email: memberUser.email,
    }));
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new AppError(
        'User is already a member of this board',
        409,
        'MEMBER_ALREADY_EXISTS',
      );
    }

    throw err;
  }
}

export async function removeBoardMember(
  boardId: string,
  userId: string,
): Promise<void> {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { id: true, role: true },
  });

  if (!membership) {
    throw new AppError('Board member not found', 404, 'MEMBER_NOT_FOUND');
  }

  if (membership.role === Role.OWNER) {
    throw new AppError(
      'You do not have permission to remove this member',
      403,
      'FORBIDDEN',
    );
  }

  await prisma.boardMember.delete({ where: { id: membership.id } });
}
