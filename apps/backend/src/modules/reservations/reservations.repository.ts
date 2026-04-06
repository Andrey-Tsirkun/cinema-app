import { Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const reservationPublicSelect = {
  id: true,
  userId: true,
  sessionId: true,
  seatId: true,
  status: true,
  createdAt: true,
  expiresAt: true,
  session: {
    select: {
      id: true,
      startTime: true,
      price: true,
      hall: { select: { id: true, name: true } },
      movie: { select: { id: true, title: true, duration: true } },
    },
  },
  seat: {
    select: { id: true, hallId: true, row: true, number: true },
  },
} satisfies Prisma.ReservationSelect;

export type ReservationPublic = Prisma.ReservationGetPayload<{
  select: typeof reservationPublicSelect;
}>;

/** BOOKED rows that still block the seat (hold not expired, or confirmed with no expiry). */
export function activeBookedWhere(now: Date): Prisma.ReservationWhereInput {
  return {
    status: ReservationStatus.BOOKED,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSessionHall(sessionId: string): Promise<{ id: string; hallId: string } | null> {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, hallId: true },
    });
  }

  findSeatHall(seatId: string): Promise<{ id: string; hallId: string } | null> {
    return this.prisma.seat.findUnique({
      where: { id: seatId },
      select: { id: true, hallId: true },
    });
  }

  /**
   * Cancel BOOKED rows whose hold has passed (server-side cleanup).
   */
  async cancelExpiredBookings(): Promise<number> {
    const result = await this.prisma.reservation.updateMany({
      where: {
        status: ReservationStatus.BOOKED,
        expiresAt: { not: null, lt: new Date() },
      },
      data: { status: ReservationStatus.CANCELLED },
    });
    return result.count;
  }

  /**
   * Remove prior CANCELLED rows and expired BOOKED holds for this session+seat, then create a new hold.
   */
  async createBooked(
    userId: string,
    sessionId: string,
    seatId: string,
    expiresAt: Date,
  ): Promise<ReservationPublic> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.reservation.updateMany({
        where: {
          sessionId,
          seatId,
          status: ReservationStatus.BOOKED,
          expiresAt: { not: null, lt: now },
        },
        data: { status: ReservationStatus.CANCELLED },
      });
      await tx.reservation.deleteMany({
        where: {
          sessionId,
          seatId,
          status: ReservationStatus.CANCELLED,
        },
      });
      return tx.reservation.create({
        data: {
          userId,
          sessionId,
          seatId,
          status: ReservationStatus.BOOKED,
          expiresAt,
        },
        select: reservationPublicSelect,
      });
    });
  }

  findManyForUser(userId: string): Promise<ReservationPublic[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      select: reservationPublicSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOwned(
    userId: string,
    reservationId: string,
  ): Promise<{ id: string; status: ReservationStatus } | null> {
    return this.prisma.reservation.findFirst({
      where: { id: reservationId, userId },
      select: { id: true, status: true },
    });
  }

  async setCancelled(id: string): Promise<void> {
    await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED },
    });
  }

  async confirmHold(userId: string, reservationId: string): Promise<ReservationPublic | null> {
    const existing = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId,
        status: ReservationStatus.BOOKED,
      },
      select: { id: true, expiresAt: true },
    });
    if (!existing) {
      return null;
    }
    if (existing.expiresAt === null) {
      return this.prisma.reservation.findUnique({
        where: { id: reservationId },
        select: reservationPublicSelect,
      });
    }
    if (existing.expiresAt <= new Date()) {
      return null;
    }
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { expiresAt: null },
      select: reservationPublicSelect,
    });
  }
}
