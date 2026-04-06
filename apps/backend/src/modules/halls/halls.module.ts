import { Module } from '@nestjs/common';
import { HallsController } from './halls.controller';
import { HallsRepository } from './halls.repository';
import { HallsService } from './halls.service';

@Module({
  controllers: [HallsController],
  providers: [HallsRepository, HallsService],
  exports: [HallsService],
})
export class HallsModule {}
