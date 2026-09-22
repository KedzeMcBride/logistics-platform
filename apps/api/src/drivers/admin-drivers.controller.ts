import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '@repo/shared';

import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth';
import type { AuthenticatedUser } from '../auth/strategies';

import { DriversService } from './drivers.service';
import { NearbyDriversQueryDto } from './dto';

class RejectDriverDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@Controller('admin/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPERATIONS_MANAGER)
export class AdminDriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  listAll(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.drivers.listAllDrivers(status);
  }

  @Get('pending')
  listPending() {
    return this.drivers.listPendingApprovals();
  }

  @Get('nearby')
  findNearby(@Query() query: NearbyDriversQueryDto) {
    return this.drivers.findNearby(query);
  }

  @Patch(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.drivers.approve(id, user.id);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectDriverDto,
  ) {
    return this.drivers.reject(id, user.id, dto.reason ?? 'No reason provided');
  }

  @Patch('documents/:documentId/approve')
  approveDocument(@CurrentUser() user: AuthenticatedUser, @Param('documentId') id: string) {
    return this.drivers.approveDocument(id, user.id);
  }

  @Patch('documents/:documentId/reject')
  rejectDocument(@CurrentUser() user: AuthenticatedUser, @Param('documentId') id: string) {
    return this.drivers.rejectDocument(id, user.id);
  }
}
