import { Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SeatAvailabilityStatus = 'AVAILABLE' | 'BOOKED';

export type SessionSeatWithAvailability = {
  id: string;
  hallId: string;
  row: number;
  number: number;
  status: SeatAvailabilityStatus;
};
export const sessionPublicSelect = {
  id: true,
  movieId: true,
  hallId: true,
  startTime: true,
  price: true,
  movie: {
    select: {
      id: true,
      title: true,
      duration: true,
    },
  },
  hall: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.SessionSelect;

export type SessionPublic = Prisma.SessionGetPayload<{ select: typeof sessionPublicSelect }>;

function utcDayRange(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
  return { start, end };
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: { date?: string; hallId?: string }): Promise<SessionPublic[]> {
    const where: Prisma.SessionWhereInput = {};
    if (filters.hallId) {
      where.hallId = filters.hallId;
    }
    if (filters.date) {
      const { start, end } = utcDayRange(filters.date);
      where.startTime = {
        gte: start,
        lt: end,
      };
    }
    return this.prisma.session.findMany({
      where,
      select: sessionPublicSelect,
      orderBy: { startTime: 'asc' },
    });
  }

  findById(id: string): Promise<SessionPublic | null> {
    return this.prisma.session.findUnique({
      where: { id },
      select: sessionPublicSelect,
    });
  }

  /**
   * Seat map for a session: all seats in the session hall with BOOKED vs AVAILABLE (ARCHITECTURE §9).
   */
  async findSeatAvailabilityForSession(
    sessionId: string,
  ): Promise<SessionSeatWithAvailability[] | null> {
    const sessionRow = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { hallId: true },
    });
    if (!sessionRow) {
      return null;
    }

    const [seats, bookedRows] = await Promise.all([
      this.prisma.seat.findMany({
        where: { hallId: sessionRow.hallId },
        select: { id: true, hallId: true, row: true, number: true },
        orderBy: [{ row: 'asc' }, { number: 'asc' }],
      }),
      this.prisma.reservation.findMany({
        where: {
          sessionId,
          status: ReservationStatus.BOOKED,
        },
        select: { seatId: true },
      }),
    ]);

    const booked = new Set(bookedRows.map((r) => r.seatId));
    return seats.map((s) => ({
      id: s.id,
      hallId: s.hallId,
      row: s.row,
      number: s.number,
      status: booked.has(s.id) ? ('BOOKED' as const) : ('AVAILABLE' as const),
    }));
  }
}