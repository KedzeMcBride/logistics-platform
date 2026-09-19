import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@repo/shared';

import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth';
import type { AuthenticatedUser } from '../auth/strategies';

import { DriversService } from './drivers.service';
import { AddDocumentDto, AddVehicleDto, SetAvailabilityDto, UpdateVehicleDto } from './dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.drivers.getMe(user.id);
  }

  @Post('documents')
  addDocument(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddDocumentDto) {
    return this.drivers.addDocument(user.id, dto);
  }

  @Post('vehicles')
  addVehicle(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddVehicleDto) {
    return this.drivers.addVehicle(user.id, dto);
  }

  @Patch('vehicles/:id')
  updateVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.drivers.updateVehicle(user.id, id, dto);
  }

  @Delete('vehicles/:id')
  deleteVehicle(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.drivers.deleteVehicle(user.id, id);
  }

  @Patch('availability')
  setAvailability(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetAvailabilityDto) {
    return this.drivers.setAvailability(user.id, dto);
  }
}
