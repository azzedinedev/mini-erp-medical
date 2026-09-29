import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';

describe('PermissionsGuard', () => {
  it('allows a declared permission', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([{ module: 'patients', action: 'view' }]) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: { roles: [{ permissions: ['patients:view'] }] } }) }), getHandler: jest.fn(), getClass: jest.fn() } as unknown as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a missing permission', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([{ module: 'patients', action: 'delete' }]) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: { roles: [{ permissions: ['patients:view'] }] } }) }), getHandler: jest.fn(), getClass: jest.fn() } as unknown as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow('Permission insuffisante');
  });
});
