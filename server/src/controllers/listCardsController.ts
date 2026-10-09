import type { Request, Response } from 'express';
import { readPathParam } from '../lib/requestParams.js';
import { createCard, deleteCard, moveCard, updateCard } from '../services/cardsService.js';
import { createList, deleteList, updateList } from '../services/listsService.js';
import type {
  CreateCardBody,
  CreateListBody,
  MoveCardBody,
  UpdateCardBody,
  UpdateListBody,
} from '../validators/listCards.js';
import { emitToBoard } from '../socket/index.js';

function boardId(req: Request): string {
  return readPathParam(req.params.boardId, 'boardId');
}

function listId(req: Request): string {
  return readPathParam(req.params.listId, 'listId');
}

function cardId(req: Request): string {
  return readPathParam(req.params.cardId, 'cardId');
}

export async function createListRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const list = await createList(boardId(req), req.body as CreateListBody);
  await emitToBoard('list:created', boardId(req), { boardId: boardId(req), list });
  res.status(201).json({ success: true, data: { list } });
}

export async function updateListRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const list = await updateList(
    listId(req),
    req.body as UpdateListBody,
  );
  await emitToBoard('list:updated', boardId(req), { boardId: boardId(req), list });
  res.status(200).json({ success: true, data: { list } });
}

export async function deleteListRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const currentBoardId = boardId(req);
  const currentListId = listId(req);
  await deleteList(currentListId);
  await emitToBoard('list:deleted', currentBoardId, { boardId: currentBoardId, listId: currentListId });
  res.status(200).json({
    success: true,
    data: { message: 'List and all child cards deleted successfully' },
  });
}

export async function createCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const card = await createCard(listId(req), req.body as CreateCardBody);
  await emitToBoard('card:created', boardId(req), { boardId: boardId(req), listId: listId(req), card });
  res.status(201).json({ success: true, data: { card } });
}

export async function updateCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const card = await updateCard(cardId(req), req.body as UpdateCardBody);
  await emitToBoard('card:updated', boardId(req), { boardId: boardId(req), card });
  res.status(200).json({ success: true, data: { card } });
}

export async function moveCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await moveCard(cardId(req), req.body as MoveCardBody);
  const { card, sourceListId } = result;
  await emitToBoard('card:moved', boardId(req), {
    boardId: boardId(req),
    cardId: card.id,
    sourceListId,
    targetListId: card.listId,
    position: card.position,
    updatedAt: card.updatedAt,
  });
  res.status(200).json({ success: true, data: { card } });
}

export async function deleteCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const currentBoardId = boardId(req);
  const currentCardId = cardId(req);
  const { listId: currentListId } = await deleteCard(currentCardId);
  await emitToBoard('card:deleted', currentBoardId, {
    boardId: currentBoardId,
    listId: currentListId,
    cardId: currentCardId,
  });
  res.status(200).json({
    success: true,
    data: { message: 'Card deleted successfully' },
  });
}
