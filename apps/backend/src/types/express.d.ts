import type { UserPublic } from '../modules/users/users.repository';

declare global {
  namespace Express {
    // Populated by JwtAuthGuard after Bearer token verification
    interface User extends UserPublic {}
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: Express.User;
  }
}

export {};
