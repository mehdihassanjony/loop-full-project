import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TokenService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  public async validate(token: string) {
    const headers = { Authorization: token };
    try {
      const observable = this.httpService.get(
        `${this.configService.get('authService')}/auth/validate-token`,
        {
          headers,
        },
      );
      const {
        data: { data: user },
      } = await lastValueFrom(observable);

      if (!user) throw new UnauthorizedException('User not found!');
      return user;
    } catch (ex) {
      if (ex.response && ex.response.status >= 400 && ex.response.status < 500)
        throw new HttpException(
          { message: ex.response.data.message },
          ex.response.status,
        );
      else {
        Logger.error(ex.message);
        throw new HttpException(
          { message: 'Internal server error.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
