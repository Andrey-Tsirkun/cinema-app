import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const hallPublicSelect = {
  id: true,
  name: true,
  rowsCount: true,
  seatsPerRow: true,
} satisfies Prisma.HallSelect;

export type HallPublic = Prisma.HallGetPayload<{ select: typeof hallPublicSelect }>;

export const seatPublicSelect = {
  id: true,
  hallId: true,
  row: true,
  number: true,
} satisfies Prisma.SeatSelect;

export type SeatPublic = Prisma.SeatGetPayload<{ select: typeof seatPublicSelect }>;

@Injectable()
export class HallsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<HallPublic[]> {
    return this.prisma.hall.findMany({
      select: hallPublicSelect,
      orderBy: { name: 'asc' },
    });
  }

  hallExists(id: string): Promise<boolean> {
    return this.prisma.hall
      .findUnique({
        where: { id },
        select: { id: true },
      })
      .then((row) => row !== null);
  }

  findSeatsByHallId(hallId: string): Promise<SeatPublic[]> {
    return this.prisma.seat.findMany({
      where: { hallId },
      select: seatPublicSelect,
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });
  }
}
