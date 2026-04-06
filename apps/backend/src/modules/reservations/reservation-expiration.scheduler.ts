import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationExpirationScheduler {
  private readonly logger = new Logger(ReservationExpirationScheduler.name);

  constructor(private readonly reservationsRepository: ReservationsRepository) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweepExpiredHolds(): Promise<void> {
    const count = await this.reservationsRepository.cancelExpiredBookings();
    if (count > 0) {
      this.logger.log(`Auto-cancelled ${count} expired reservation hold(s)`);
    }
  }
}
