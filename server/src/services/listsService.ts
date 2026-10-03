import { AppError } from '../lib/AppError.js';
import { prisma } from '../lib/prisma.js';
import type {
  CreateListBody,
  UpdateListBody,
} from '../validators/listCards.js';
import { choosePosition, type PositionedItem } from './positionService.js';

async function rebalanceLists(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  items: PositionedItem[],
): Promise<PositionedItem[]> {
  const rebalanced = items.map((item, index) => ({
    ...item,
    position: (index + 1) * 1000,
  }));

  await Promise.all(
    rebalanced.map(({ id, position }) =>
      transaction.list.update({ where: { id }, data: { position } }),
    ),
  );

  return rebalanced;
}

export async function createList(boardId: string, input: CreateListBody) {
  return prisma.$transaction(async (transaction) => {
    const items = await transaction.list.findMany({
      where: { boardId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: { id: true, position: true },
    });
    const position = await choosePosition(items, input.position, () =>
      rebalanceLists(transaction, items),
    );

    return transaction.list.create({
      data: { boardId, title: input.title, position },
      select: {
        id: true,
        boardId: true,
        title: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
}

export async function updateList(listId: string, input: UpdateListBody) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.list.findUnique({
      where: { id: listId },
      select: { id: true, boardId: true },
    });

    if (!current) {
      throw new AppError('List not found', 404, 'LIST_NOT_FOUND');
    }

    let position: number | undefined;

    if (input.position !== undefined) {
      const items = await transaction.list.findMany({
        where: { boardId: current.boardId, id: { not: listId } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: { id: true, position: true },
      });

      position = await choosePosition(items, input.position, async () => {
        const rebalanced = await rebalanceLists(transaction, items);
        return rebalanced;
      });
    }

    return transaction.list.update({
      where: { id: listId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(position !== undefined ? { position } : {}),
      },
      select: {
        id: true,
        boardId: true,
        title: true,
        position: true,
        updatedAt: true,
      },
    });
  });
}

export async function deleteList(listId: string): Promise<void> {
  await prisma.list.delete({ where: { id: listId } });
}
