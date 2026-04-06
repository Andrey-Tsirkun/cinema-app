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
   * Remove prior CANCELLED rows for this session+seat so a new BOOKED row can be inserted
   * under @@unique([sessionId, seatId]).
   */
  async createBooked(
    userId: string,
    sessionId: string,
    seatId: string,
  ): Promise<ReservationPublic> {
    return this.prisma.$transaction(async (tx) => {
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

  findOwned(userId: string, reservationId: string): Promise<{ id: string; status: ReservationStatus } | null> {
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
}
