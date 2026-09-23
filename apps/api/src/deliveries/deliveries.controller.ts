import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@repo/shared'; // was `import type` — needs to be a value import for @Roles(Role.DRIVER)

import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth'; // added Roles — wasn't imported before
import type { AuthenticatedUser } from '../auth/strategies';

import { DeliveriesService } from './deliveries.service';
import { CancelDeliveryDto, CreateDeliveryDto, ListDeliveriesDto, QuoteDeliveryDto } from './dto';
import { RejectAssignmentDto } from './dto/reject-assignment.dto';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Post('quote')
  quote(@Body() dto: QuoteDeliveryDto) {
    return this.deliveries.quote(dto);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDeliveryDto) {
    return this.deliveries.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListDeliveriesDto) {
    return this.deliveries.list(user.id, user.role as Role, query);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deliveries.detail(user.id, user.role as Role, id);
  }

  @Patch(':id/confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deliveries.confirm(user.id, id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelDeliveryDto,
  ) {
    return this.deliveries.cancel(user.id, id, dto);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard) // class-level @UseGuards(JwtAuthGuard) already runs; this adds role check on top
  @Roles(Role.DRIVER)
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deliveries.acceptAssignment(user.id, id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectAssignmentDto,
  ) {
    return this.deliveries.rejectAssignment(user.id, id, dto.reason);
  }
}
