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
  res.status(200).json({ success: true, data: { list } });
}

export async function deleteListRoute(
  req: Request,
  res: Response,
): Promise<void> {
  await deleteList(listId(req));
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
  res.status(201).json({ success: true, data: { card } });
}

export async function updateCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const card = await updateCard(cardId(req), req.body as UpdateCardBody);
  res.status(200).json({ success: true, data: { card } });
}

export async function moveCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const card = await moveCard(cardId(req), req.body as MoveCardBody);
  res.status(200).json({ success: true, data: { card } });
}

export async function deleteCardRoute(
  req: Request,
  res: Response,
): Promise<void> {
  await deleteCard(cardId(req));
  res.status(200).json({
    success: true,
    data: { message: 'Card deleted successfully' },
  });
}
