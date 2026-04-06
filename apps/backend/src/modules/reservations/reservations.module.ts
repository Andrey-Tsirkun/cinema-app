import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { ReservationExpirationScheduler } from './reservation-expiration.scheduler';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [ScheduleModule, ThrottlerModule, AuthModule],
  controllers: [ReservationsController],
  providers: [ReservationsRepository, ReservationsService, ReservationExpirationScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
