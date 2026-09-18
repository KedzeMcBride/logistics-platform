import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { Role } from '@repo/shared';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import type { LoginDto, RefreshDto, RegisterDto } from './dto';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = AuthTokens & {
  user: {
    id: string;
    email: string;
    role: Role;
    fullName: string | null;
  };
};

const REFRESH_TOKEN_BYTES = 48;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.role !== Role.CUSTOMER && dto.role !== Role.DRIVER) {
      throw new UnauthorizedException('Cannot self-register with this role');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        ...(dto.role === Role.CUSTOMER
          ? { customerProfile: { create: { fullName: dto.fullName } } }
          : { driverProfile: { create: { fullName: dto.fullName } } }),
      },
      include: {
        customerProfile: true,
        driverProfile: true,
      },
    });

    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: this.toSafeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { customerProfile: true, driverProfile: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Account suspended');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: this.toSafeUser(user),
    };
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const newTokens = await this.issueTokens(stored.user, stored.familyId);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return newTokens;
  }

  async logout(dto: RefreshDto): Promise<void> {
    const tokenHash = this.hashToken(dto.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: User, familyId?: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const ttl = this.parseTtl(this.config.get<string>('JWT_REFRESH_TTL') ?? '30d');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId: familyId ?? randomUUID(),
        expiresAt: new Date(Date.now() + ttl),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unit = match[2] ?? 'd';
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 0);
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    role: Role;
    customerProfile?: { fullName: string } | null;
    driverProfile?: { fullName: string } | null;
  }): AuthResponse['user'] {
    const fullName = user.customerProfile?.fullName ?? user.driverProfile?.fullName ?? null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName,
    };
  }
}
