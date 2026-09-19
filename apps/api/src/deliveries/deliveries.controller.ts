import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { Role } from '@repo/shared';

import { CurrentUser, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth/strategies';

import { DeliveriesService } from './deliveries.service';
import { CancelDeliveryDto, CreateDeliveryDto, ListDeliveriesDto, QuoteDeliveryDto } from './dto';

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
}
