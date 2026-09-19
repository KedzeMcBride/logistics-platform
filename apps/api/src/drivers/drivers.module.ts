import { Module } from '@nestjs/common';

import { AdminDriversController } from './admin-drivers.controller';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  controllers: [DriversController, AdminDriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}