import { Injectable, NotFoundException } from '@nestjs/common';
import { MoviePublic, MoviesRepository } from './movies.repository';

export type { MoviePublic };

@Injectable()
export class MoviesService {
  constructor(private readonly moviesRepository: MoviesRepository) {}

  findAll(): Promise<MoviePublic[]> {
    return this.moviesRepository.findAll();
  }

  async findOne(id: string): Promise<MoviePublic> {
    const movie = await this.moviesRepository.findById(id);
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }
    return movie;
  }
}
