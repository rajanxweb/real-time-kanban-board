import type { Request, Response } from 'express';
import { AppError } from '../lib/AppError.js';
import { readPathParam } from '../lib/requestParams.js';
import {
  createBoard,
  deleteBoard,
  getBoard,
  listUserBoards,
  updateBoard,
} from '../services/boardsService.js';
import type {
  CreateBoardBody,
  UpdateBoardBody,
} from '../validators/boards.js';

function authenticatedUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Missing or invalid authentication token', 401, 'UNAUTHORIZED');
  }

  return req.user.id;
}

export async function create(req: Request, res: Response): Promise<void> {
  const board = await createBoard(
    authenticatedUserId(req),
    req.body as CreateBoardBody,
  );

  res.status(201).json({ success: true, data: { board } });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const boards = await listUserBoards(authenticatedUserId(req));
  res.status(200).json({ success: true, data: { boards } });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const board = await getBoard(
    readPathParam(req.params.boardId, 'boardId'),
    authenticatedUserId(req),
  );
  res.status(200).json({ success: true, data: { board } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const board = await updateBoard(
    readPathParam(req.params.boardId, 'boardId'),
    req.body as UpdateBoardBody,
  );

  res.status(200).json({ success: true, data: { board } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteBoard(readPathParam(req.params.boardId, 'boardId'));
  res.status(200).json({
    success: true,
    data: { message: 'Board deleted successfully' },
  });
}
