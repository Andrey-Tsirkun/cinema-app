import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import type { UserPublic } from '../users/users.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: UserPublic, done: (err: Error | null, id?: string) => void): void {
    done(null, user.id);
  }

  deserializeUser(
    id: string,
    done: (err: Error | null, user?: UserPublic | false) => void,
  ): void {
    void this.usersService.findByIdPublic(id).then(
      (user) => done(null, user ?? false),
      (err: unknown) => done(err as Error, false),
    );
  }
}
