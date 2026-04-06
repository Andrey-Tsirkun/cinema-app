import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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
}
