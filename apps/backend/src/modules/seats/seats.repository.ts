import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const seatPublicSelect = {
  id: true,
  hallId: true,
  row: true,
  number: true,
} satisfies Prisma.SeatSelect;

export type SeatPublic = Prisma.SeatGetPayload<{ select: typeof seatPublicSelect }>;

@Injectable()
export class SeatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  hallExists(hallId: string): Promise<boolean> {
    return this.prisma.hall
      .findUnique({
        where: { id: hallId },
        select: { id: true },
      })
      .then((row) => row !== null);
  }

  findByHallId(hallId: string): Promise<SeatPublic[]> {
    return this.prisma.seat.findMany({
      where: { hallId },
      select: seatPublicSelect,
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });
  }
}
