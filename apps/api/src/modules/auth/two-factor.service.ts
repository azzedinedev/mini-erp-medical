import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async beginSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    const secret = authenticator.generateSecret();
    const issuer = this.config.get<string>('app.totpIssuer') ?? process.env.TOTP_ISSUER ?? 'MediFlow';
    const otpauth = authenticator.keyuri(user.email, issuer, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth, { width: 240, margin: 2 });
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
    return { issuer, account: user.email, qrCodeDataUrl, secret };
  }

  async verifyAndEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true } });
    if (!user?.totpSecret || !authenticator.check(code, user.totpSecret)) throw new UnauthorizedException('Code TOTP invalide');
    return this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: true }, select: { id: true, totpEnabled: true } });
  }
}
