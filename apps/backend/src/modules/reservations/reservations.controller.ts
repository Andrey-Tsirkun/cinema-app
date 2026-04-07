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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { UserPublic } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBatchReservationsDto } from './dto/create-batch-reservations.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationPublic, ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('batch')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  createBatch(
    @Req() req: Request,
    @Body() dto: CreateBatchReservationsDto,
  ): Promise<ReservationPublic[]> {
    const user = req.user as UserPublic;
    return this.reservationsService.createBatchConfirmed(user.id, dto);
  }

  @Post()
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(@Req() req: Request, @Body() dto: CreateReservationDto): Promise<ReservationPublic> {
    const user = req.user as UserPublic;
    return this.reservationsService.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req: Request): Promise<ReservationPublic[]> {
    const user = req.user as UserPublic;
    return this.reservationsService.findMy(user.id);
  }

  @Post(':id/confirm')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  confirm(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReservationPublic> {
    const user = req.user as UserPublic;
    return this.reservationsService.confirm(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const user = req.user as UserPublic;
    await this.reservationsService.cancel(user.id, id);
  }
}
