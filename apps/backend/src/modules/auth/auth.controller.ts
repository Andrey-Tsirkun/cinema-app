import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { UserPublic } from '../users/users.repository';
import { AuthenticatedGuard } from './guards/authenticated.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Redirect handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
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
