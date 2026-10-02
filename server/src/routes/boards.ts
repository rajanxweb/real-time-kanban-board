import { Router } from 'express';
import { add, list, remove } from '../controllers/boardMembersController.js';
import {
  create,
  getOne,
  listMine,
  remove as deleteBoard,
  update,
} from '../controllers/boardsController.js';
import { requireAuth } from '../middleware/auth.js';
import {
  requireBoardMember,
  requireBoardOwner,
} from '../middleware/boardAuthorization.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  addBoardMemberBodySchema,
  createBoardBodySchema,
  updateBoardBodySchema,
} from '../validators/boards.js';

export const boardsRouter = Router();

boardsRouter.get('/', requireAuth, asyncHandler(listMine));
boardsRouter.post(
  '/',
  requireAuth,
  validateBody(createBoardBodySchema),
  asyncHandler(create),
);

boardsRouter.get(
  '/:boardId/members',
  requireAuth,
  requireBoardMember,
  asyncHandler(list),
);
boardsRouter.post(
  '/:boardId/members',
  requireAuth,
  requireBoardOwner('Only the board owner can add members'),
  validateBody(addBoardMemberBodySchema),
  asyncHandler(add),
);
boardsRouter.delete(
  '/:boardId/members/:userId',
  requireAuth,
  requireBoardOwner('You do not have permission to remove this member'),
  asyncHandler(remove),
);

boardsRouter.get(
  '/:boardId',
  requireAuth,
  requireBoardMember,
  asyncHandler(getOne),
);
boardsRouter.patch(
  '/:boardId',
  requireAuth,
  requireBoardOwner('Only the board owner can update board details'),
  validateBody(updateBoardBodySchema),
  asyncHandler(update),
);
boardsRouter.delete(
  '/:boardId',
  requireAuth,
  requireBoardOwner('Only the board owner can delete this board'),
  asyncHandler(deleteBoard),
);
