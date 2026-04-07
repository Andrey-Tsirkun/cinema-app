import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { UserPublic } from '../users/users.repository';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pair = await this.authService.register(dto);
    this.authService.setRefreshCookie(res, pair.refreshToken);
    return this.authService.toPublicResponse(pair);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const pair = await this.authService.login(dto);
    this.authService.setRefreshCookie(res, pair.refreshToken);
    return this.authService.toPublicResponse(pair);
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!raw) {
      this.authService.clearRefreshCookie(res);
      throw new UnauthorizedException();
    }
    try {
      const next = await this.authService.rotateRefreshToken(raw);
      this.authService.setRefreshCookie(res, next.refreshToken);
      return { accessToken: next.accessToken };
    } catch {
      this.authService.clearRefreshCookie(res);
      throw new UnauthorizedException();
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): UserPublic {
    return req.user as UserPublic;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    this.authService.clearRefreshCookie(res);
    return { ok: true };
  }
}
