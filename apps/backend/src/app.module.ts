import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { HallsModule } from './modules/halls/halls.module';
import { MoviesModule } from './modules/movies/movies.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 10_000,
        },
      ],
      errorMessage: 'Too many requests, please try again later.',
    }),
    PrismaModule,
    HealthModule,
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
