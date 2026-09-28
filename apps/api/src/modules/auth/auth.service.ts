import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { CaptchaService } from './captcha.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Optional() private readonly captcha?: CaptchaService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: AuthPrincipal } | { requiresTwoFactor: true; email: string }> {
    await this.captcha?.assertValid(dto.captchaToken);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { roles: { include: { role: { include: { permissions: true } } } } },
    });
    if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    if (user.totpEnabled) {
      if (!dto.totpCode) return { requiresTwoFactor: true, email: user.email };
      if (!user.totpSecret || !authenticator.check(dto.totpCode, user.totpSecret)) throw new UnauthorizedException('Code TOTP invalide');
    }

    const principal: AuthPrincipal = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map(({ role }) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions.map((permission) => `${permission.module}:${permission.action}`),
      })),
    };
    const accessToken = await this.jwt.signAsync(principal, {
      secret: this.config.get<string>('app.jwtAccessSecret'),
      expiresIn: this.config.get<string>('app.accessExpiresIn') as never,
    });
    const refreshToken = await this.jwt.signAsync({ sub: user.id, type: 'refresh' }, {
      secret: this.config.get<string>('app.jwtRefreshSecret'),
      expiresIn: this.config.get<string>('app.refreshExpiresIn') as never,
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, 12),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken, user: principal };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: { sub?: string; type?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('app.jwtRefreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }
    if (payload.type !== 'refresh' || !payload.sub) throw new UnauthorizedException('Refresh token invalide');
    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    const stored = await Promise.all(candidates.map(async (candidate) => (await bcrypt.compare(refreshToken, candidate.tokenHash) ? candidate : null)));
    if (!stored.some(Boolean)) throw new UnauthorizedException('Session expirée');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: { include: { permissions: true } } } } },
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Utilisateur inactif');
    const principal: AuthPrincipal = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map(({ role }) => ({ id: role.id, name: role.name, permissions: role.permissions.map((p) => `${p.module}:${p.action}`) })),
    };
    return {
      accessToken: await this.jwt.signAsync(principal, {
        secret: this.config.get<string>('app.jwtAccessSecret'),
        expiresIn: this.config.get<string>('app.accessExpiresIn') as never,
      }),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
