import type { UserPublic } from '../modules/users/users.repository';

declare global {
  namespace Express {
    // Populated by Passport after OAuth and session deserialization
    interface User extends UserPublic {}
  }
}

export {};
