import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from './notifications.service';

describe('NotificationsService (integration)', () => {
  let module: TestingModule;
  let service: NotificationsService;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] })],
      providers: [NotificationsService, PrismaService],
    }).compile();

    service = module.get(NotificationsService);
    prisma = module.get(PrismaService);
    await prisma.$connect();

    // Create a fresh test user for this suite
    const testUser = await prisma.user.create({
      data: {
        email: `notif-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'CUSTOMER',
        customerProfile: { create: { fullName: 'Notif Tester' } },
      },
    });
    userId = testUser.id;

    await prisma.notification.createMany({
      data: [
        {
          userId,
          type: 'TEST',
          title: 'One',
          body: 'Body one',
          channel: 'IN_APP',
          status: 'SENT',
        },
        {
          userId,
          type: 'TEST',
          title: 'Two',
          body: 'Body two',
          channel: 'IN_APP',
          status: 'SENT',
        },
        {
          userId,
          type: 'TEST',
          title: 'Three',
          body: 'Body three',
          channel: 'IN_APP',
          status: 'SENT',
          readAt: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: { contains: 'notif-test-' } } });
    await prisma.$disconnect();
    await module.close();
  });

  it('lists notifications for the user', async () => {
    const result = await service.list(userId, { page: 1, limit: 20 });
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(3);
  });

  it('paginates results', async () => {
    const page1 = await service.list(userId, { page: 1, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.totalPages).toBe(2);

    const page2 = await service.list(userId, { page: 2, limit: 2 });
    expect(page2.items).toHaveLength(1);
  });

  it('filters unread only', async () => {
    const result = await service.list(userId, { page: 1, limit: 20, unreadOnly: true });
    expect(result.total).toBe(2);
  });

  it('returns unread count', async () => {
    const result = await service.unreadCount(userId);
    expect(result.count).toBe(2);
  });

  it('marks a single notification as read', async () => {
    const list = await service.list(userId, { page: 1, limit: 20, unreadOnly: true });
    const first = list.items[0];
    expect(first).toBeDefined();

    const updated = await service.markRead(userId, first!.id);
    expect(updated.readAt).toBeInstanceOf(Date);

    const count = await service.unreadCount(userId);
    expect(count.count).toBe(1);
  });

  it('is idempotent when marking an already-read notification', async () => {
    const list = await service.list(userId, { page: 1, limit: 20 });
    const read = list.items.find((n) => n.readAt);
    expect(read).toBeDefined();

    const result = await service.markRead(userId, read!.id);
    expect(result.readAt).toBeInstanceOf(Date);
  });

  it('rejects marking another user notification as read', async () => {
    const list = await service.list(userId, { page: 1, limit: 20 });
    const first = list.items[0];
    expect(first).toBeDefined();

    await expect(
      service.markRead('00000000-0000-0000-0000-000000000000', first!.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks all unread notifications as read', async () => {
    const result = await service.markAllRead(userId);
    expect(result.updated).toBeGreaterThanOrEqual(0);

    const count = await service.unreadCount(userId);
    expect(count.count).toBe(0);
  });

  it('returns 0 unread after marking all', async () => {
    await service.markAllRead(userId);
    const result = await service.unreadCount(userId);
    expect(result.count).toBe(0);
  });
});
