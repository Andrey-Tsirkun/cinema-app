import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

/** Non-empty placeholders so Passport instantiates; real login needs GOOGLE_* in env. */
const OAUTH_PLACEHOLDER_ID = '__OAUTH_NOT_CONFIGURED_CLIENT_ID__';
const OAUTH_PLACEHOLDER_SECRET = '__OAUTH_NOT_CONFIGURED_CLIENT_SECRET__';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID')?.trim() || OAUTH_PLACEHOLDER_ID;
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET')?.trim() || OAUTH_PLACEHOLDER_SECRET;
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
      'http://localhost:4000/auth/google/callback';

    if (clientID === OAUTH_PLACEHOLDER_ID || clientSecret === OAUTH_PLACEHOLDER_SECRET) {
      GoogleStrategy.logger.warn(
        'Google OAuth is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). /auth/google will not work until you set them.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const subject = profile.id;
    const email = profile.emails?.[0]?.value;
    if (!email?.trim()) {
      done(new UnauthorizedException('Google account has no verified email'), false);
      return;
    }
    try {
      const user = await this.usersService.findOrCreateOAuthUser({
        provider: 'google',
        subject,
        email: email.trim(),
      });
      done(null, user);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
