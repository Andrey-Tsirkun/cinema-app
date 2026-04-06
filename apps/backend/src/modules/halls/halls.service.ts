import { Injectable, NotFoundException } from '@nestjs/common';
import {
  HallPublic,
  HallsRepository,
  SeatPublic,
} from './halls.repository';

export type { HallPublic, SeatPublic };

@Injectable()
export class HallsService {
  constructor(private readonly hallsRepository: HallsRepository) {}

  findAll(): Promise<HallPublic[]> {
    return this.hallsRepository.findAll();
  }

  async findSeats(hallId: string): Promise<SeatPublic[]> {
    const exists = await this.hallsRepository.hallExists(hallId);
    if (!exists) {
      throw new NotFoundException('Hall not found');
    }
    return this.hallsRepository.findSeatsByHallId(hallId);
  }
}
