import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthorizeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authenticatorService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const permission: {
      module: string;
      roles: string[];
      allowAnonymous?: boolean;
    } = this.reflector.getAllAndOverride(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permission) {
      return false;
    }

    // First check if anonymous (public access) is allowed.
    if (permission.allowAnonymous !== undefined && permission.allowAnonymous) {
      return true;
    }

    // Validate user
    await this.authenticatorService.validateToken(req);

    // Check role permission
    return permission.roles.some((role) => req.user?.role === role);
  }
}
