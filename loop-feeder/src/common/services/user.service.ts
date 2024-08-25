import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  protected secretKey: string;
  protected userService: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.secretKey = this.config.get('secretKey');
    this.userService = this.config.get('userService');
  }

  public async getUserByUserId(id: string) {
    if (!id) return {};
    try {
      const headers = { 'secret-key': this.secretKey };
      const observable = this.http.get(this.userService + '/secret/users', {
        params: {
          ids: JSON.stringify([id]),
        },
        headers,
      });

      const {
        data: { data: users },
      } = await lastValueFrom(observable);
      if (users.length === 0) throw new Error('Invalid user id');
      return users[0];
    } catch (ex) {
      if (ex.response) throw new Error(ex.response.data.message);
      else throw new Error(ex.message);
    }
  }
}
