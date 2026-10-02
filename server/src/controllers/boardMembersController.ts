import type { Request, Response } from 'express';
import { readPathParam } from '../lib/requestParams.js';
import { addBoardMember, listBoardMembers, removeBoardMember } from '../services/boardMembersService.js';
import type { AddBoardMemberBody } from '../validators/boards.js';

export async function list(req: Request, res: Response): Promise<void> {
  const members = await listBoardMembers(
    readPathParam(req.params.boardId, 'boardId'),
  );
  res.status(200).json({ success: true, data: { members } });
}

export async function add(req: Request, res: Response): Promise<void> {
  const member = await addBoardMember(
    readPathParam(req.params.boardId, 'boardId'),
    req.body as AddBoardMemberBody,
  );

  res.status(201).json({ success: true, data: { member } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await removeBoardMember(
    readPathParam(req.params.boardId, 'boardId'),
    readPathParam(req.params.userId, 'userId'),
  );
  res.status(200).json({
    success: true,
    data: { message: 'Member removed successfully' },
  });
}
