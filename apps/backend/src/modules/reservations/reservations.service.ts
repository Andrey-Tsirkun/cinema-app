import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { CreateReservationDto } from './dto/create-reservation.dto';
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

    try {
      return await this.reservationsRepository.createBooked(userId, dto.sessionId, dto.seatId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This seat is already booked for this session');
      }
      throw e;
    }
  }

  findMy(userId: string): Promise<ReservationPublic[]> {
    return this.reservationsRepository.findManyForUser(userId);
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
