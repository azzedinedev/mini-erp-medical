import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthPrincipal, JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('utilisateurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission('users', 'view')
  list() { return this.users.list(); }

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @Req() request: { user: AuthPrincipal }) { return this.users.updateProfile(request.user.sub, dto); }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  archive(@Param('id') id: string) { return this.users.archive(id); }
}
