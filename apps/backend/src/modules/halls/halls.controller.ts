import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type { SeatPublic } from '../seats/seats.service';
import { HallPublic, HallsService } from './halls.service';
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Get()
  findAll(): Promise<HallPublic[]> {
    return this.hallsService.findAll();
  }

  @Get(':id/seats')
  findSeats(@Param('id', ParseUUIDPipe) id: string): Promise<SeatPublic[]> {
    return this.hallsService.findSeats(id);
  }
}
