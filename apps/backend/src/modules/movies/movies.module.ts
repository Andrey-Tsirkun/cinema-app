import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesRepository } from './movies.repository';
import { MoviesService } from './movies.service';

@Module({
  controllers: [MoviesController],
  providers: [MoviesRepository, MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
