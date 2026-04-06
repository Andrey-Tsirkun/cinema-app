import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { UserPublic } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export type AuthTokensResponse = {
  accessToken: string;
  user: UserPublic;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthTokensResponse> {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
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

  private issueTokens(user: UserPublic): AuthTokensResponse {
    const accessToken = this.jwtService.sign({ sub: user.id });
    return { accessToken, user };
  }
}
