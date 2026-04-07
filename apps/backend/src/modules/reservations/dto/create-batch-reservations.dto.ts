import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { MAX_SEATS_PER_USER_SESSION } from '../reservation.constants';

export class CreateBatchReservationsDto {
  @IsUUID()
  sessionId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SEATS_PER_USER_SESSION)
  seatIds!: string[];
}
