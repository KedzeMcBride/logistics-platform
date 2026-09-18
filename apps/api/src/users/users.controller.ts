import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth/strategies';
import type { UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user.id, dto);
  }
}
