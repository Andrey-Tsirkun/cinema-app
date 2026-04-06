import { createRequire } from 'node:module';
import session from 'express-session';
import type { RequestHandler } from 'express';

const nodeRequire = createRequire(__filename);
const { RedisStore } = nodeRequire('connect-redis') as {
  RedisStore: new (opts: { client: unknown; prefix?: string }) => session.Store;
};

const SESSION_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export async function createSessionMiddleware(): Promise<RequestHandler> {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not set');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const redisUrl = process.env.REDIS_URL?.trim();

  const cookie = {
    httpOnly: true,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
  };

  const baseOptions: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie,
  };

  if (redisUrl) {
    const { createClient } = await import('redis');
    const client = createClient({ url: redisUrl });
    client.on('error', (err: Error) => {
      console.error('Redis session client error', err);
    });
    await client.connect();

    return session({
      ...baseOptions,
      store: new RedisStore({
        client,
        prefix: 'cinema:sess:',
      }),
    });
  }

  if (isProduction) {
    throw new Error('REDIS_URL is required in production for shared session storage across replicas');
  }

  console.warn(
    'REDIS_URL not set: using in-memory session store (not suitable for horizontal scaling)',
  );
  return session(baseOptions);
}
