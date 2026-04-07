import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { UserPublic } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { LoginDto } from './dto/login.dto';

export type AuthTokensResponse = {
  accessToken: string;
  user: UserPublic;
};

type IssuedPair = AuthTokensResponse & { refreshToken: string };

function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
  if (match) {
    const n = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mult: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return n * (mult[unit] ?? 86_400_000);
  }
  return 7 * 86_400_000;
}

@Injectable()
export class AuthService {
  private readonly accessExpires: JwtSignOptions['expiresIn'];
  private readonly refreshExpires: JwtSignOptions['expiresIn'];
  private readonly refreshCookieMaxAgeMs: number;
  private readonly cookieSecure: boolean;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    this.accessExpires = (config.get<string>('JWT_EXPIRES_IN') ?? '15m') as JwtSignOptions['expiresIn'];
    const refreshTtl = config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    this.refreshExpires = refreshTtl as JwtSignOptions['expiresIn'];
    this.refreshCookieMaxAgeMs = ttlToMs(refreshTtl);
    this.cookieSecure =
      config.get<string>('COOKIE_SECURE') === 'true' || process.env.NODE_ENV === 'production';
  }

  async register(dto: CreateUserDto): Promise<IssuedPair> {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<IssuedPair> {
    const email = dto.email.toLowerCase();
    const row = await this.usersService.findByEmail(email);
    if (!row?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, row.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const user = await this.usersService.findByIdPublic(row.id);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueTokens(user);
  }

  /**
   * Validates refresh JWT, issues new access + rotated refresh tokens.
   */
  async rotateRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; typ?: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; typ?: string }>(refreshToken);
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.findByIdPublic(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      accessToken: this.signAccess(user.id),
      refreshToken: this.signRefresh(user.id),
    };
  }

  setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: this.refreshCookieMaxAgeMs,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      path: '/',
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
    });
  }

  toPublicResponse(pair: IssuedPair): AuthTokensResponse {
    const { refreshToken: _r, ...rest } = pair;
    return rest;
  }

  private issueTokens(user: UserPublic): IssuedPair {
    return {
      accessToken: this.signAccess(user.id),
      refreshToken: this.signRefresh(user.id),
      user,
    };
  }

  private signAccess(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, typ: 'access' },
      { expiresIn: this.accessExpires },
    );
  }

  private signRefresh(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, typ: 'refresh' },
      { expiresIn: this.refreshExpires },
    );
  }
}
