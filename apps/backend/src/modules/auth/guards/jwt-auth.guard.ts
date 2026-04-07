import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = raw.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; typ?: string }>(token);
      if (payload.typ !== 'access') {
        throw new UnauthorizedException();
      }
      const user = await this.usersService.findByIdPublic(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      req.user = user as Express.User;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
