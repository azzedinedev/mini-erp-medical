import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { CaptchaService } from './captcha.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.get<string>('app.jwtAccessSecret') }),
    }),
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard, TwoFactorService, CaptchaService],
  exports: [AuthService, JwtModule, JwtAuthGuard, PermissionsGuard, TwoFactorService],
})
export class AuthModule {}
