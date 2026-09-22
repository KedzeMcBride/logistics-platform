import { Module } from '@nestjs/common';

import { DriversModule } from '../drivers';

import { AssignmentService } from './assignment.service';

@Module({
  imports: [DriversModule],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
