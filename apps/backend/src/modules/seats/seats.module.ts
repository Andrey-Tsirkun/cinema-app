import { Module } from '@nestjs/common';
import { SeatsRepository } from './seats.repository';
import { SeatsService } from './seats.service';

@Module({
  providers: [SeatsRepository, SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}
