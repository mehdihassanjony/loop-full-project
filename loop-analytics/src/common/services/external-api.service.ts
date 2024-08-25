import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

/**
 * Represents service for external APIs.
 */
@Injectable()
export class ExternalApiService {
  public constructor(private configService: ConfigService, private httpService: HttpService) { }

  /**
   * Get company information of the given CRM user (admin, kam, cluster etc).
   * @param userId User id of the CRM user.
   * @param companyId Company id of the associated CRM user.
   * @returns Returns company information.
   */
  public async getCrmCompany(userId: string, companyId: number) {
    const secretKey = this.configService.get('secretKey');
    const companyServiceUrl = this.configService.get('companyService');

    try {
      const endpoint = `${companyServiceUrl}/secret/company/${companyId}/crm/${userId}`;
      const headers = { headers: { 'secret-key': secretKey } };
      const {
        data: { data },
      } = await lastValueFrom(this.httpService.get(endpoint, headers));
      return data;
    } catch (ex) {
      if (ex.response) {
        throw new Error(ex.response.data.message);
      } else {
        throw new Error(ex.message);
      }
    }
  }

  /**
   * Get company information of the given shipper.
   * @param userId User id of the shipper.
   * @param companyId Company id of the shipper.
   * @returns Returns company information.
   */
   public async getShipperCompany(userId: string, companyId: number) {
    const secretKey = this.configService.get('secretKey');
    const companyServiceUrl = this.configService.get('companyService');

    try {
      const endpoint = `${companyServiceUrl}/secret/company/${companyId}/companyuser/${userId}`;
      const headers = { headers: { 'secret-key': secretKey } };
      const {
        data: { data },
      } = await lastValueFrom(this.httpService.get(endpoint, headers));
      return data;
    } catch (ex) {
      if (ex.response) {
        throw new Error(ex.response.data.message);
      } else {
        throw new Error(ex.message);
      }
    }
  }  
}
