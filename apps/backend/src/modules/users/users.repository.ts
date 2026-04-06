import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const userPublicSelect = {
  id: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type UserPublic = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  createWithCredentials(email: string, passwordHash: string): Promise<UserPublic> {
    return this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
      },
      select: userPublicSelect,
    });
  }

  findByIdPublic(id: string): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
  }
}
