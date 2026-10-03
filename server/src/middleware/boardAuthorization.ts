import type { RequestHandler } from 'express';
import { AppError } from '../lib/AppError.js';
import { readPathParam } from '../lib/requestParams.js';
import {
  boardExists,
  getCardBoardId,
  getListBoardId,
  isBoardMember,
  isBoardOwner,
} from '../services/boardAccessService.js';

async function verifyBoardAccess(
  boardId: string,
  userId: string,
  ownerOnly: boolean,
  ownerForbiddenMessage?: string,
): Promise<void> {
  const allowed = ownerOnly
    ? await isBoardOwner(boardId, userId)
    : await isBoardMember(boardId, userId);

  if (allowed) {
    return;
  }

  if (!(await boardExists(boardId))) {
    throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
  }

  if (ownerOnly) {
    throw new AppError(
      ownerForbiddenMessage ?? 'Only the board owner can perform this action',
      403,
      'FORBIDDEN',
    );
  }

  throw new AppError(
    'You are not a member of this board',
    403,
    'ACCESS_DENIED',
  );
}

function boardAccessGuard(
  ownerOnly: boolean,
  ownerForbiddenMessage?: string,
): RequestHandler {
  return (req, _res, next) => {
    const userId = req.user?.id;
    let boardId: string;

    try {
      boardId = readPathParam(req.params.boardId, 'boardId');
    } catch (err) {
      next(err);
      return;
    }

    if (!userId) {
      next(
        new AppError('Missing or invalid authentication token', 401, 'UNAUTHORIZED'),
      );
      return;
    }

    void verifyBoardAccess(boardId, userId, ownerOnly, ownerForbiddenMessage).then(
      () => next(),
      (err: unknown) => next(err),
    );
  };
}

export const requireBoardMember = boardAccessGuard(false);

export function requireBoardOwner(message: string): RequestHandler {
  return boardAccessGuard(true, message);
}

function resourceBoardAccessGuard(resource: 'list' | 'card'): RequestHandler {
  return (req, _res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      next(
        new AppError('Missing or invalid authentication token', 401, 'UNAUTHORIZED'),
      );
      return;
    }

    let resourceId: string;
    let boardId: string;

    try {
      resourceId = readPathParam(
        resource === 'list' ? req.params.listId : req.params.cardId,
        resource === 'list' ? 'listId' : 'cardId',
      );
      boardId = readPathParam(req.params.boardId, 'boardId');
    } catch (err) {
      next(err);
      return;
    }

    const getResourceBoardId =
      resource === 'list' ? getListBoardId : getCardBoardId;

    void getResourceBoardId(resourceId).then(
      async (resourceBoardId) => {
        if (!resourceBoardId || resourceBoardId !== boardId) {
          throw new AppError(
            `${resource === 'list' ? 'List' : 'Card'} not found`,
            404,
            `${resource.toUpperCase()}_NOT_FOUND`,
          );
        }

        await verifyBoardAccess(resourceBoardId, userId, false);
        next();
      },
      (err: unknown) => next(err),
    ).catch((err: unknown) => next(err));
  };
}

export const requireListBoardMember = resourceBoardAccessGuard('list');
export const requireCardBoardMember = resourceBoardAccessGuard('card');
