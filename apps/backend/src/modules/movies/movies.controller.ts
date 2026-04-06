import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MoviePublic, MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  findAll(): Promise<MoviePublic[]> {
    return this.moviesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MoviePublic> {
    return this.moviesService.findOne(id);
  }
}
