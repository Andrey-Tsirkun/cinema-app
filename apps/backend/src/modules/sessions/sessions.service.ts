import { Injectable, NotFoundException } from '@nestjs/common';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { SessionPublic, SessionsRepository } from './sessions.repository';

export type { SessionPublic };

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  findAll(query: ListSessionsQueryDto): Promise<SessionPublic[]> {
    return this.sessionsRepository.findMany({
      date: query.date,
      hallId: query.hallId,
    });
  }

  async findOne(id: string): Promise<SessionPublic> {
    const session = await this.sessionsRepository.findById(id);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }
}
