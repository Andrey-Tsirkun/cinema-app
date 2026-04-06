import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserPublic } from '../users/users.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationPublic, ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(AuthenticatedGuard)
  create(@Req() req: Request, @Body() dto: CreateReservationDto): Promise<ReservationPublic> {
    const user = req.user as UserPublic;
    return this.reservationsService.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(AuthenticatedGuard)
  findMy(@Req() req: Request): Promise<ReservationPublic[]> {
    const user = req.user as UserPublic;
    return this.reservationsService.findMy(user.id);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const user = req.user as UserPublic;
    await this.reservationsService.cancel(user.id, id);
  }
}
