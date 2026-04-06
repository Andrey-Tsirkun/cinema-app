import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPublic, UsersRepository } from './users.repository';

export type { UserPublic };

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserPublic> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.usersRepository.createWithCredentials(email, passwordHash);
  }

  /**
   * For auth: includes password hash when present.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  async findByIdOrThrow(id: string): Promise<UserPublic> {
    const user = await this.usersRepository.findByIdPublic(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIdPublic(id: string): Promise<UserPublic | null> {
    return this.usersRepository.findByIdPublic(id);
  }

  /**
   * OAuth sign-in: returns existing linked user or creates / links by verified email.
   */
  async findOrCreateOAuthUser(params: {
    provider: string;
    subject: string;
    email: string;
  }): Promise<UserPublic> {
    const email = params.email.toLowerCase();

    const byOAuth = await this.usersRepository.findPublicByOAuth(params.provider, params.subject);
    if (byOAuth) {
      return byOAuth;
    }

    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      if (existing.oauthSubject && existing.oauthSubject !== params.subject) {
        throw new ConflictException('Email is linked to another OAuth account');
      }
      if (existing.oauthProvider && existing.oauthProvider !== params.provider) {
        throw new ConflictException('Email is linked to another sign-in method');
      }
      if (!existing.oauthSubject) {
        return this.usersRepository.linkOAuthAccount(existing.id, params.provider, params.subject);
      }
      const linked = await this.usersRepository.findPublicByOAuth(params.provider, params.subject);
      if (linked) {
        return linked;
      }
      const fallback = await this.usersRepository.findByIdPublic(existing.id);
      if (!fallback) {
        throw new NotFoundException('User not found');
      }
      return fallback;
    }

    return this.usersRepository.createOAuthUser(email, params.provider, params.subject);
  }
}
