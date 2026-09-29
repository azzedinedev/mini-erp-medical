import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { TwoFactorService } from './two-factor.service';

class VerifyTotpDto { @IsString() @Length(6, 6) code!: string; }
type RequestWithUser = { user: AuthPrincipal };
@ApiTags('authentification / 2FA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactor: TwoFactorService) {}
  @Post('setup') setup(@Req() req: RequestWithUser) { return this.twoFactor.beginSetup(req.user.sub); }
  @Post('verify') verify(@Body() dto: VerifyTotpDto, @Req() req: RequestWithUser) { return this.twoFactor.verifyAndEnable(req.user.sub, dto.code); }
}
