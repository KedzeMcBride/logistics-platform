import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Body for PATCH /deliveries/:id/reject. Optional — a driver can reject
 * without giving a reason, matching how DeliveriesService.cancel() already
 * treats its own optional reason field (Day 10 convention).
 */
export class RejectAssignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}
