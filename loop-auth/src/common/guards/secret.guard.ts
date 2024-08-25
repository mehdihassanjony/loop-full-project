import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    if (
      req.headers['secret-key'] !==
      this.configService.get('secretConfig').secret
    ) {
      throw new BadRequestException("secret key didn't match");
    }
    return true;
  }
}
