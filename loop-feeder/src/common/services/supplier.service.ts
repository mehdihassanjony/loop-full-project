import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class SupplierService {
  protected secretKey: string;
  protected supService: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.secretKey = this.config.get('secretKey');
    this.supService = this.config.get('supplierService');
  }

  public async getSupplierList(
    originDistrict: string,
    truckCategory: string,
    slug?: string,
  ) {
    try {
      const headers = {
        'secret-key': this.secretKey,
        'Accept-Encoding': 'gzip,deflate,compress',
      };
      let url =
        this.supService +
        `/secret/supplier/?originDistrict=${originDistrict}&truckCategory=${truckCategory}`;
      if (slug) url += `&slug=${slug}`;
      const observable = this.http
        .get(url, { headers })
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

  // this endpoint returns all supplier list with pagination
  // if mentioned ids thats will return that filtered supplier list
  // otherwise return all list
  public async getAllSupplier(ids: string[], page: number, limit: number) {
    try {
      const headers = {
        'secret-key': this.secretKey,
        'Accept-Encoding': 'gzip,deflate,compress',
      };
      let url =
        this.supService +
        `/secret/suppliers/?ids=${JSON.stringify(
          ids,
        )}&page=${page}&limit=${limit}`;
      const observable = this.http
        .get(url, { headers })
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
