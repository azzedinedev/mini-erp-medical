import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
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

  @Get('trash')
  @RequirePermission('users', 'view')
  trash() { return this.users.trash(); }

  @Get()
  @RequirePermission('users', 'view')
  list() { return this.users.list(); }

  @Post()
  @RequirePermission('users', 'create')
  create(@Body() dto: CreateUserDto) { return this.users.create(dto); }

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @Req() request: { user: AuthPrincipal }) { return this.users.updateProfile(request.user.sub, dto); }

  @Patch(':id')
  @RequirePermission('users', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) { return this.users.update(id, dto); }

  @Post(':id/restore')
  @RequirePermission('users', 'update')
  restore(@Param('id') id: string) { return this.users.restore(id); }

  @Delete(':id/permanent')
  @RequirePermission('users', 'delete_permanent')
  permanentlyRemove(@Param('id') id: string) { return this.users.removePermanently(id); }

  @Delete(':id')
  @RequirePermission('users', 'archive')
  archive(@Param('id') id: string) { return this.users.archive(id); }
}
