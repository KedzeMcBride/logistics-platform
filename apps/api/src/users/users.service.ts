import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        driverProfile: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true, driverProfile: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    if (dto.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    if (user.customerProfile && (dto.fullName || dto.avatarUrl)) {
      await this.prisma.customerProfile.update({
        where: { userId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName } : {}),
          ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        },
      });
    }

    if (user.driverProfile && (dto.fullName || dto.avatarUrl)) {
      await this.prisma.driverProfile.update({
        where: { userId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName } : {}),
          ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        },
      });
    }

    return this.getMe(userId);
  }
}
