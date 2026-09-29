import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CaptchaResponse = { success?: boolean; 'error-codes'?: string[] };

@Injectable()
export class CaptchaService {
  constructor(private readonly config: ConfigService) {}

  async assertValid(token?: string): Promise<void> {
    const provider = (this.config.get<string>('app.captchaProvider') ?? 'disabled').toLowerCase();
    if (provider === 'disabled') return;
    if (!token) throw new UnauthorizedException('Captcha requis');

    const isTurnstile = provider === 'turnstile';
    const isHcaptcha = provider === 'hcaptcha';
    if (!isTurnstile && !isHcaptcha) throw new UnauthorizedException('Fournisseur Captcha non configuré');
    const secret = this.config.get<string>(isTurnstile ? 'app.turnstileSecret' : 'app.hcaptchaSecret');
    if (!secret) throw new UnauthorizedException('Secret Captcha non configuré');

    try {
      const endpoint = isTurnstile ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify' : 'https://hcaptcha.com/siteverify';
      const body = new URLSearchParams({ secret, response: token });
      const result = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!result.ok) throw new Error(`captcha_http_${result.status}`);
      const verification = await result.json() as CaptchaResponse;
      if (!verification.success) throw new Error(verification['error-codes']?.join(',') ?? 'captcha_rejected');
    } catch {
      throw new UnauthorizedException('Captcha invalide');
    }
  }
}
