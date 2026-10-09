import { AppError } from '../lib/AppError.js';
import { prisma } from '../lib/prisma.js';
import type {
  CreateCardBody,
  MoveCardBody,
  UpdateCardBody,
} from '../validators/listCards.js';
import { choosePosition, type PositionedItem } from './positionService.js';

async function rebalanceCards(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  items: PositionedItem[],
): Promise<PositionedItem[]> {
  const rebalanced = items.map((item, index) => ({
    ...item,
    position: (index + 1) * 1000,
  }));

  await Promise.all(
    rebalanced.map(({ id, position }) =>
      transaction.card.update({ where: { id }, data: { position } }),
    ),
  );

  return rebalanced;
}

async function assertBoardAssignee(
  boardId: string,
  assigneeId: string | null | undefined,
): Promise<void> {
  if (assigneeId == null) {
    return;
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: assigneeId } },
    select: { id: true },
  });

  if (!membership) {
    throw new AppError(
      'Assignee must be an active member of this board',
      400,
      'INVALID_ASSIGNEE',
    );
  }
}

export async function createCard(listId: string, input: CreateCardBody) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { boardId: true },
  });

  if (!list) {
    throw new AppError('List not found', 404, 'LIST_NOT_FOUND');
  }

  await assertBoardAssignee(list.boardId, input.assigneeId);

  return prisma.$transaction(async (transaction) => {
    const items = await transaction.card.findMany({
      where: { listId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: { id: true, position: true },
    });
    const position = await choosePosition(items, input.position, () =>
      rebalanceCards(transaction, items),
    );

    return transaction.card.create({
      data: {
        listId,
        title: input.title,
        description: input.description,
        position,
        dueDate: input.dueDate === undefined ? undefined : new Date(input.dueDate),
        assigneeId: input.assigneeId,
      },
      select: {
        id: true,
        listId: true,
        title: true,
        description: true,
        position: true,
        dueDate: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
}

export async function updateCard(cardId: string, input: UpdateCardBody) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { list: { select: { boardId: true } } },
  });

  if (!card) {
    throw new AppError('Card not found', 404, 'CARD_NOT_FOUND');
  }

  if (input.assigneeId !== undefined) {
    await assertBoardAssignee(card.list.boardId, input.assigneeId);
  }

  return prisma.card.update({
    where: { id: cardId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.dueDate !== undefined
        ? {
            dueDate:
              input.dueDate === null ? null : new Date(input.dueDate),
          }
        : {}),
      ...(input.assigneeId !== undefined
        ? { assigneeId: input.assigneeId }
        : {}),
    },
    select: {
      id: true,
      listId: true,
      title: true,
      description: true,
      position: true,
      dueDate: true,
      assigneeId: true,
      updatedAt: true,
    },
  });
}

export async function moveCard(cardId: string, input: MoveCardBody) {
  return prisma.$transaction(async (transaction) => {
    const card = await transaction.card.findUnique({
      where: { id: cardId },
      select: { listId: true, list: { select: { boardId: true } } },
    });
    const targetList = await transaction.list.findUnique({
      where: { id: input.targetListId },
      select: { id: true, boardId: true },
    });

    if (!card || !targetList || targetList.boardId !== card.list.boardId) {
      throw new AppError(
        'Target list does not belong to this board',
        400,
        'INVALID_TARGET_LIST',
      );
    }

    const items = await transaction.card.findMany({
      where: {
        listId: targetList.id,
        ...(card.listId === targetList.id ? { id: { not: cardId } } : {}),
      },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: { id: true, position: true },
    });
    const position = await choosePosition(items, input.position, () =>
      rebalanceCards(transaction, items),
    );

    const updatedCard = await transaction.card.update({
      where: { id: cardId },
      data: { listId: targetList.id, position },
      select: { id: true, listId: true, position: true, updatedAt: true },
    });
    return { card: updatedCard, sourceListId: card.listId };
  });
}

export async function deleteCard(cardId: string): Promise<{ listId: string }> {
  return prisma.card.delete({ where: { id: cardId }, select: { listId: true } });
}
