import type { RequestHandler } from 'express';
import { AppError } from '../lib/AppError.js';
import { readPathParam } from '../lib/requestParams.js';
import {
  boardExists,
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
