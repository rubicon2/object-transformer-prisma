import { PrismaClient } from '../generated/prisma/client';
import { beforeEach } from 'vitest';

const db = new PrismaClient();

export const users = [
  {
    id: 'abc',
    createdAt: new Date(Date.now()),
    email: 'jimbo.johnson@outlook.com',
    first_name: 'Jimbo',
    last_name: 'Johnson',
  },
  {
    id: 'def',
    createdAt: new Date(Date.now()),
    email: 'flambo.blobson@outlook.com',
    first_name: 'Flambo',
    last_name: 'Blobson',
  },
  {
    id: 'ghi',
    createdAt: new Date(Date.now()),
    email: 'nadine.blobbers@outlook.com',
    first_name: 'Nadine',
    last_name: 'Blobbers',
  },
  {
    id: 'jkl',
    createdAt: new Date(Date.now()),
    email: 'jennifer.blobbers@outlook.com',
    first_name: 'Jennifer',
    last_name: 'Blobbers',
  },
];

export const files = [
  {
    id: '123',
    createdAt: new Date(Date.now()),
    ownerId: 'abc',
    url: 'my-first-file.txt',
  },
  {
    id: '456',
    createdAt: new Date(Date.now()),
    ownerId: 'abc',
    url: 'my-second-file.txt',
  },
  {
    id: '789',
    createdAt: new Date(Date.now()),
    ownerId: 'def',
    url: 'my-third-file.txt',
  },
];

beforeEach(async () => {
  // Clear database, populate with test data.
  await db.$transaction([
    db.user.deleteMany(),
    db.file.deleteMany(),
    db.user.createMany({
      data: users,
    }),
    db.file.createMany({
      data: files,
    }),
  ]);
});
