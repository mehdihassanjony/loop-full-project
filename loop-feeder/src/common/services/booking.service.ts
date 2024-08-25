import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class BookingService {
  protected secretKey: string;
  protected bookingService: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.secretKey = this.config.get('secretKey');
    this.bookingService = this.config.get('bookingService');
  }

  public async getReturnSuppliersByZone(zone: string, truckCategory: string) {
    try {
      const headers = { headers: { 'secret-key': this.secretKey } };
      const observable = this.http
        .get(
          this.bookingService +
            `/secret/booking/return-suppliers/?zone=${zone}&truckCategory=${truckCategory}`,
          headers,
        )
        .pipe(map((resp) => resp.data));
      const { data } = await lastValueFrom(observable);
      return data;
    } catch (ex) {
      if (ex.response)
        throw new HttpException(
          { message: ex.response.data.message },
          ex.response.status,
        );
      else
        throw new HttpException(
          { message: ex.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
