import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (!req.headers['authorization'])
      throw new UnauthorizedException(
        'Authentication credentials were not provided.',
      );
    const token = req.headers['authorization'];
    const {
      isVerified,
      phoneVerified,
      emailVerified,
      Verified,
      isEnabled,
      ...user
    } = await this.tokenService.validate(token);
    req.user = user;
    return true;
  }
}
