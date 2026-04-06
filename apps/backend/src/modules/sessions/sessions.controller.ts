import { Controller, Get, Param, ParseUUIDPipe, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import {
  SessionPublic,
  SessionSeatWithAvailability,
  SessionsService,
} from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )
  findAll(@Query() query: ListSessionsQueryDto): Promise<SessionPublic[]> {
    return this.sessionsService.findAll(query);
  }

  @Get(':id/seats')
  findSessionSeats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SessionSeatWithAvailability[]> {
    return this.sessionsService.findSeatsWithAvailability(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SessionPublic> {
    return this.sessionsService.findOne(id);
  }
}
