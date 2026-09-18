import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/shared';

import { PrismaService } from '../prisma/prisma.service';

import { AuthService } from './auth.service';

describe('AuthService (integration)', () => {
  let module: TestingModule;
  let service: AuthService;
  let prisma: PrismaService;

  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env', '../../.env'],
        }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET') ?? 'test-secret',
            signOptions: { expiresIn: '15m' },
          }),
        }),
      ],
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'auth-test-' } } });
    await prisma.$disconnect();
    await module.close();
  });

  it('registers a customer with hashed password', async () => {
    const result = await service.register({
      email: testEmail,
      password: testPassword,
      role: Role.CUSTOMER,
      fullName: 'Integration Test',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe(Role.CUSTOMER);

    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(dbUser?.passwordHash).not.toBe(testPassword);
    expect(dbUser?.passwordHash.startsWith('$2')).toBe(true);
  });

  it('rejects duplicate email registration', async () => {
    await expect(
      service.register({
        email: testEmail,
        password: testPassword,
        role: Role.CUSTOMER,
        fullName: 'Duplicate',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects self-registration as ADMIN', async () => {
    await expect(
      service.register({
        email: `auth-test-admin-${Date.now()}@example.com`,
        password: testPassword,
        role: Role.ADMIN,
        fullName: 'Hacker',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in with correct credentials', async () => {
    const result = await service.login({ email: testEmail, password: testPassword });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await expect(
      service.login({ email: testEmail, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes tokens and rotates', async () => {
    const login = await service.login({ email: testEmail, password: testPassword });
    const refreshed = await service.refresh({ refreshToken: login.refreshToken });
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
  });

  it('detects refresh token reuse and revokes family', async () => {
    const login = await service.login({ email: testEmail, password: testPassword });
    const rotated = await service.refresh({ refreshToken: login.refreshToken });

    await expect(service.refresh({ refreshToken: login.refreshToken })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    await expect(service.refresh({ refreshToken: rotated.refreshToken })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
