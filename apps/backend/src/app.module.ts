import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HallsModule } from './modules/halls/halls.module';
import { MoviesModule } from './modules/movies/movies.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    MoviesModule,
    HallsModule,
    SessionsModule,
    ReservationsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
