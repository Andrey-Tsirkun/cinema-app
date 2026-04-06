import { Injectable } from '@nestjs/common';
import { SeatsService } from '../seats/seats.service';
import { HallPublic, HallsRepository } from './halls.repository';
import type { SeatPublic } from '../seats/seats.service';

export type { HallPublic };

@Injectable()
export class HallsService {
  constructor(
    private readonly hallsRepository: HallsRepository,
    private readonly seatsService: SeatsService,
  ) {}

  findAll(): Promise<HallPublic[]> {
    return this.hallsRepository.findAll();
  }

  findSeats(hallId: string): Promise<SeatPublic[]> {
    return this.seatsService.findByHallId(hallId);
  }
}
