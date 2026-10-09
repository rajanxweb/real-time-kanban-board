import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import request from 'supertest';
import { io as createSocketClient, type Socket } from 'socket.io-client';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { attachSocketServer } from '../src/socket/index.js';

type RegisteredAccount = {
  token: string;
  user: { id: string; email: string; name: string };
};

async function registerAccount(
  email: string,
  name = 'Test User',
): Promise<RegisteredAccount> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, name, password: 'Password123!' });

  expect(response.status).toBe(201);
  return response.body.data as RegisteredAccount;
}

async function createBoard(token: string, title = 'Test board') {
  const response = await request(app)
    .post('/api/v1/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  expect(response.status).toBe(201);
  return response.body.data.board as { id: string };
}

async function createList(token: string, boardId: string, title: string) {
  const response = await request(app)
    .post(`/api/v1/boards/${boardId}/lists`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  expect(response.status).toBe(201);
  return response.body.data.list as { id: string };
}

async function createCard(
  token: string,
  boardId: string,
  listId: string,
  title: string,
  position: number,
) {
  const response = await request(app)
    .post(`/api/v1/boards/${boardId}/lists/${listId}/cards`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title, position });

  expect(response.status).toBe(201);
  return response.body.data.card as { id: string };
}

describe('API integration', () => {
  beforeEach(async () => {
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers an account and returns a token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: '  PERSON@example.com ',
        name: 'Test Person',
        password: 'Password123!',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('person@example.com');
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it('rejects registering the same email twice', async () => {
    await registerAccount('duplicate@example.com');

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'duplicate@example.com',
        name: 'Another User',
        password: 'Password123!',
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await registerAccount('login@example.com', 'Login User');

    const success = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'Password123!' });
    const failure = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'incorrect' });

    expect(success.status).toBe(200);
    expect(success.body.data.user.email).toBe('login@example.com');
    expect(success.body.data.token).toEqual(expect.any(String));
    expect(failure.status).toBe(401);
    expect(failure.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('does not allow /auth/me without a token', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('denies a non-member access to a board', async () => {
    const owner = await registerAccount('owner@example.com');
    const visitor = await registerAccount('visitor@example.com');
    const board = await createBoard(owner.token);

    const response = await request(app)
      .get(`/api/v1/boards/${board.id}`)
      .set('Authorization', `Bearer ${visitor.token}`);

    expect([403, 404]).toContain(response.status);
  });

  it('allows only the board owner to delete a board', async () => {
    const owner = await registerAccount('owner@example.com');
    const member = await registerAccount('member@example.com');
    const board = await createBoard(owner.token);
    const invitation = await request(app)
      .post(`/api/v1/boards/${board.id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: member.user.email });

    expect(invitation.status).toBe(201);

    const memberDelete = await request(app)
      .delete(`/api/v1/boards/${board.id}`)
      .set('Authorization', `Bearer ${member.token}`);
    const ownerDelete = await request(app)
      .delete(`/api/v1/boards/${board.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(memberDelete.status).toBe(403);
    expect(ownerDelete.status).toBe(200);
  });

  it('moves a card between lists at the requested ordered position', async () => {
    const owner = await registerAccount('move@example.com');
    const board = await createBoard(owner.token);
    const source = await createList(owner.token, board.id, 'Source');
    const target = await createList(owner.token, board.id, 'Target');
    const moving = await createCard(
      owner.token,
      board.id,
      source.id,
      'Moving card',
      1000,
    );
    await createCard(owner.token, board.id, target.id, 'First card', 1000);
    await createCard(owner.token, board.id, target.id, 'Last card', 2000);

    const move = await request(app)
      .patch(`/api/v1/boards/${board.id}/cards/${moving.id}/move`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ targetListId: target.id, position: 1500 });
    const canvas = await request(app)
      .get(`/api/v1/boards/${board.id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    const lists = canvas.body.data.board.lists as Array<{
      id: string;
      cards: Array<{ title: string; position: number }>;
    }>;

    expect(move.status).toBe(200);
    expect(lists.find((list) => list.id === source.id)?.cards).toHaveLength(0);
    expect(
      lists.find((list) => list.id === target.id)?.cards.map((card) => card.title),
    ).toEqual(['First card', 'Moving card', 'Last card']);
    expect(
      lists.find((list) => list.id === target.id)?.cards.map((card) => card.position),
    ).toEqual([1000, 1500, 2000]);
  });

  it('broadcasts card moves between authenticated board members and refuses a non-member', async () => {
    const owner = await registerAccount('socket-owner@example.com');
    const member = await registerAccount('socket-member@example.com');
    const visitor = await registerAccount('socket-visitor@example.com');
    const board = await createBoard(owner.token, 'Socket board');
    const invitation = await request(app)
      .post(`/api/v1/boards/${board.id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: member.user.email });
    expect(invitation.status).toBe(201);

    const source = await createList(owner.token, board.id, 'Source');
    const target = await createList(owner.token, board.id, 'Target');
    const card = await createCard(owner.token, board.id, source.id, 'Moving card', 1000);
    const httpServer = createServer(app);
    const socketServer = attachSocketServer(httpServer);
    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(0, resolve);
    });
    const address = httpServer.address();
    if (!address || typeof address === 'string') throw new Error('Socket test server did not bind to a TCP port');
    const socketUrl = `http://127.0.0.1:${address.port}`;
    const clients: Socket[] = [];

    async function connect(token: string): Promise<Socket> {
      const client = createSocketClient(socketUrl, { auth: { token }, transports: ['websocket'], reconnection: false });
      clients.push(client);
      await new Promise<void>((resolve, reject) => {
        client.once('connect', resolve);
        client.once('connect_error', reject);
      });
      return client;
    }

    async function join(client: Socket): Promise<{ success: boolean; error?: { code: string } }> {
      return new Promise((resolve) => {
        client.emit('board:join', { boardId: board.id }, (response: { success: boolean; error?: { code: string } }) => resolve(response));
      });
    }

    try {
      const ownerSocket = await connect(owner.token);
      const memberSocket = await connect(member.token);
      const visitorSocket = await connect(visitor.token);
      expect((await join(ownerSocket)).success).toBe(true);
      expect((await join(memberSocket)).success).toBe(true);
      const denied = await join(visitorSocket);
      expect(denied).toMatchObject({ success: false, error: { code: 'ACCESS_DENIED' } });

      const movedEvent = new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for card:moved')), 5000);
        memberSocket.once('card:moved', (payload: unknown) => {
          clearTimeout(timer);
          resolve(payload);
        });
      });
      const move = await request(app)
        .patch(`/api/v1/boards/${board.id}/cards/${card.id}/move`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ targetListId: target.id, position: 1000 });
      expect(move.status).toBe(200);
      expect(await movedEvent).toMatchObject({
        boardId: board.id,
        cardId: card.id,
        sourceListId: source.id,
        targetListId: target.id,
        position: 1000,
      });
    } finally {
      clients.forEach((client) => client.disconnect());
      await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    }
  }, 20000);
});
