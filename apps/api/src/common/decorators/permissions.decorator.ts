import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirement {
  module: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'archive' | 'export';
}

export const PERMISSIONS_KEY = 'mediflow:permissions';
export const RequirePermission = (
  module: string,
  action: PermissionRequirement['action'],
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSIONS_KEY, [{ module, action }]);
