import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { SessionSerializer } from './session.serializer';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [ThrottlerModule, UsersModule, PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [GoogleStrategy, SessionSerializer, AuthenticatedGuard],
  exports: [AuthenticatedGuard],
})
export class AuthModule {}
