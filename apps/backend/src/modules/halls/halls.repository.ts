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

@Injectable()
export class HallsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<HallPublic[]> {
    return this.prisma.hall.findMany({
      select: hallPublicSelect,
      orderBy: { name: 'asc' },
    });
  }
}
