import { IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  seatId!: string;
}
