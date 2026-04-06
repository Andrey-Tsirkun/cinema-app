import { Module } from '@nestjs/common';
import { SeatsModule } from '../seats/seats.module';
import { HallsController } from './halls.controller';
import { HallsRepository } from './halls.repository';
import { HallsService } from './halls.service';

@Module({
  imports: [SeatsModule],
  controllers: [HallsController],
  providers: [HallsRepository, HallsService],
  exports: [HallsService],
})
export class HallsModule {}
