import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { CreateBatchReservationsDto } from './dto/create-batch-reservations.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import {
  getReservationHoldDurationMs,
  MAX_SEATS_PER_USER_SESSION,
} from './reservation.constants';
import { ReservationPublic, ReservationsRepository } from './reservations.repository';

export type { ReservationPublic };

@Injectable()
export class ReservationsService {
  constructor(private readonly reservationsRepository: ReservationsRepository) {}

  async create(userId: string, dto: CreateReservationDto): Promise<ReservationPublic> {
    const session = await this.reservationsRepository.findSessionHall(dto.sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const seat = await this.reservationsRepository.findSeatHall(dto.seatId);
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }
    if (session.hallId !== seat.hallId) {
      throw new BadRequestException('Seat does not belong to the hall for this session');
    }

    const existingForSession = await this.reservationsRepository.countActiveBookingsForUserSession(
      userId,
      dto.sessionId,
    );
    if (existingForSession >= MAX_SEATS_PER_USER_SESSION) {
      throw new BadRequestException(
        `You can book at most ${MAX_SEATS_PER_USER_SESSION} seats per session`,
      );
    }

    const holdMs = getReservationHoldDurationMs();
    const expiresAt = new Date(Date.now() + holdMs);

    try {
      return await this.reservationsRepository.createBooked(
        userId,
        dto.sessionId,
        dto.seatId,
        expiresAt,
      );
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This seat is already booked for this session');
      }
      throw e;
    }
  }

  /**
   * Create and confirm several seats in one request (same validation as single create per seat).
   */
  async createBatchConfirmed(
    userId: string,
    dto: CreateBatchReservationsDto,
  ): Promise<ReservationPublic[]> {
    if (dto.seatIds.length !== new Set(dto.seatIds).size) {
      throw new BadRequestException('Duplicate seat ids in request');
    }

    const current = await this.reservationsRepository.countActiveBookingsForUserSession(
      userId,
      dto.sessionId,
    );
    if (current + dto.seatIds.length > MAX_SEATS_PER_USER_SESSION) {
      throw new BadRequestException(
        `You can book at most ${MAX_SEATS_PER_USER_SESSION} seats per session`,
      );
    }

    const out: ReservationPublic[] = [];
    for (const seatId of dto.seatIds) {
      const created = await this.create(userId, { sessionId: dto.sessionId, seatId });
      const confirmed = await this.confirm(userId, created.id);
      out.push(confirmed);
    }
    return out;
  }

  findMy(userId: string): Promise<ReservationPublic[]> {
    return this.reservationsRepository.findManyForUser(userId);
  }

  async confirm(userId: string, reservationId: string): Promise<ReservationPublic> {
    const updated = await this.reservationsRepository.confirmHold(userId, reservationId);
    if (!updated) {
      throw new NotFoundException('Reservation not found or hold has expired');
    }
    return updated;
  }

  async cancel(userId: string, reservationId: string): Promise<void> {
    const row = await this.reservationsRepository.findOwned(userId, reservationId);
    if (!row) {
      throw new NotFoundException('Reservation not found');
    }
    if (row.status !== ReservationStatus.BOOKED) {
      throw new ForbiddenException('Only active bookings can be cancelled');
    }
    await this.reservationsRepository.setCancelled(row.id);
  }
}
