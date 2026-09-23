import { Module } from '@nestjs/common';

import { AssignmentModule } from '../assignment';
import { DriversModule } from '../drivers';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { PricingService } from './pricing.service';

@Module({
  imports: [AssignmentModule, DriversModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, PricingService],
  exports: [DeliveriesService, PricingService],
})
export class DeliveriesModule {}
