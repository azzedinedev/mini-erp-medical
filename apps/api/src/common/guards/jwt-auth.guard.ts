import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface AuthPrincipal {
  sub: string;
  email: string;
  roles: Array<{ id: string; name: string; permissions: string[] }>;
}

type AuthRequest = { headers: { authorization?: string }; user?: AuthPrincipal };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Token manquant');

    try {
      const token = header.slice('Bearer '.length);
      const payload = await this.jwt.verifyAsync<AuthPrincipal>(token, {
        secret: this.config.get<string>('app.jwtAccessSecret'),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
