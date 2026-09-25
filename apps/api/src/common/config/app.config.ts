import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number.parseInt(process.env.API_PORT ?? '4000', 10),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'local-only-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'local-only-refresh-secret-change-me',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  captchaProvider: process.env.CAPTCHA_PROVIDER ?? 'disabled',
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY ?? '',
  hcaptchaSecret: process.env.HCAPTCHA_SECRET_KEY ?? '',
  totpIssuer: process.env.TOTP_ISSUER ?? 'MediFlow',
  storageDriver: process.env.STORAGE_DRIVER ?? 'local',
  storagePath: process.env.STORAGE_LOCAL_PATH ?? './storage',
}));
