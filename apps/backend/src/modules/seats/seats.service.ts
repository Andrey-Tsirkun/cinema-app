import { Injectable, NotFoundException } from '@nestjs/common';
import { SeatPublic, SeatsRepository } from './seats.repository';

export type { SeatPublic };

@Injectable()
export class SeatsService {
  constructor(private readonly seatsRepository: SeatsRepository) {}

  /**
   * All seats in a hall (ARCHITECTURE §8 — also used for seat map / availability context).
   */
  async findByHallId(hallId: string): Promise<SeatPublic[]> {
    const exists = await this.seatsRepository.hallExists(hallId);
    if (!exists) {
      throw new NotFoundException('Hall not found');
    }
    return this.seatsRepository.findByHallId(hallId);
  }
}
