import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { UserPublic } from '../users/users.repository';
import { AuthenticatedGuard } from './guards/authenticated.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('google')
  @UseGuards(ThrottlerGuard, AuthGuard('google'))
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  googleAuth(): void {
    // Redirect handled by Passport
  }

  @Get('google/callback')
  @UseGuards(ThrottlerGuard, AuthGuard('google'))
  @Throttle({ default: { limit: 60, ttl: 900_000 } })
  googleCallback(@Req() _req: Request, @Res() res: Response): void {
    const redirectUrl =
      this.configService.get<string>('OAUTH_SUCCESS_REDIRECT_URL') ?? 'http://localhost:3000';
    res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  me(@Req() req: Request): UserPublic {
    return req.user as UserPublic;
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  async logout(@Req() req: Request): Promise<{ ok: true }> {
    await new Promise<void>((resolve, reject) => {
      req.logout((err) => (err ? reject(err) : resolve()));
    });
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    return { ok: true };
  }
}
