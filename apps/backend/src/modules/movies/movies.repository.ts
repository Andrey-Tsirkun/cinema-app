import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const moviePublicSelect = {
  id: true,
  title: true,
  duration: true,
  description: true,
} satisfies Prisma.MovieSelect;

export type MoviePublic = Prisma.MovieGetPayload<{ select: typeof moviePublicSelect }>;

@Injectable()
export class MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<MoviePublic[]> {
    return this.prisma.movie.findMany({
      select: moviePublicSelect,
      orderBy: { title: 'asc' },
    });
  }

  findById(id: string): Promise<MoviePublic | null> {
    return this.prisma.movie.findUnique({
      where: { id },
      select: moviePublicSelect,
    });
  }
}
