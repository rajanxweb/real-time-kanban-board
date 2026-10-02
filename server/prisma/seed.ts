import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash: '$2b$10$vK6n7f0YfKj6q2mF7yUreOuE7Xg0IeG1YgW9bC3qT5vB0wR1aB4eq',
      name: 'Alice Smith',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: '$2b$10$vK6n7f0YfKj6q2mF7yUreOuE7Xg0IeG1YgW9bC3qT5vB0wR1aB4eq',
      name: 'Bob Jones',
    },
  });

  const board = await prisma.board.create({
    data: {
      title: 'Product Roadmap',
      description: 'Core Kanban board for product development',
      members: {
        create: [
          {
            userId: alice.id,
            role: 'OWNER',
          },
          {
            userId: bob.id,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  const todoList = await prisma.list.create({
    data: {
      boardId: board.id,
      title: 'To Do',
      position: 1000.0,
    },
  });

  const inProgressList = await prisma.list.create({
    data: {
      boardId: board.id,
      title: 'In Progress',
      position: 2000.0,
    },
  });

  const doneList = await prisma.list.create({
    data: {
      boardId: board.id,
      title: 'Done',
      position: 3000.0,
    },
  });

  await prisma.card.createMany({
    data: [
      {
        listId: todoList.id,
        title: 'User authentication flow',
        description: 'Implement JWT login and registration with validation',
        position: 1000.0,
        assigneeId: alice.id,
      },
      {
        listId: todoList.id,
        title: 'Design system tokens',
        description: 'Translate tactile design system into Tailwind theme',
        position: 2000.0,
        assigneeId: bob.id,
      },
      {
        listId: inProgressList.id,
        title: 'Real-time socket rooms',
        description: 'Establish board-level room subscriptions and presence',
        position: 1000.0,
        assigneeId: alice.id,
      },
      {
        listId: inProgressList.id,
        title: 'Midpoint reordering logic',
        description: 'Implement fractional index calculation and rebalance routine',
        position: 2000.0,
        assigneeId: null,
      },
      {
        listId: doneList.id,
        title: 'PostgreSQL database container',
        description: 'Configure Docker Compose service with health check',
        position: 1000.0,
        assigneeId: alice.id,
      },
      {
        listId: doneList.id,
        title: 'Project documentation',
        description: 'Document requirements, user stories, and architecture specs',
        position: 2000.0,
        assigneeId: bob.id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
