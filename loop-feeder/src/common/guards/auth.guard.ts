import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { TokenService } from 'src/common/services/token.service';

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
    const user = await this.tokenService.validate(token);
    req.user = user;
    return true;
  }
}
