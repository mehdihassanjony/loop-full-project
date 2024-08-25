import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CompanyAnalyticsFilterDto } from '../dtos/company-analytics-filter.dto';
import { plainToInstance } from 'class-transformer';
import { TripCountsResultDto } from '../dtos/trip-counts-result.dto';
import { RouteUsedResultDto } from '../dtos/route-used-result.dto';
import { RouteMetricsResultDto as RouteMetricsResultDto } from '../dtos/route-metrics-result.dto';
import { CompanyAnalyticsResultDto } from '../dtos/company-analytics-result.dto';
import { AdditionalMetricsResultDto } from '../dtos/additional-metrics-result.dto';
import { RouteCostResultDto } from '../dtos/route-cost-result.dto';
import { UserType } from 'src/common/decorators/user.decorator';
import * as moment from 'moment-timezone';
import { ExternalApiService } from 'src/common/services/external-api.service';

@Injectable()
export class CompanyAnalyticsService {
  constructor(
    @InjectEntityManager()
    private manager: EntityManager,
    private externalApiService: ExternalApiService,
  ) {}

  public async getBaseMetrics(
    filterDto: CompanyAnalyticsFilterDto,
    user: UserType,
  ) {
    if (!filterDto.companyId) {
      throw new BadRequestException('Company information is required.');
    } else if (user.role === 'shipper') {
      const companyResult = await this.externalApiService.getShipperCompany(
        user.userId,
        filterDto.companyId,
      );
      if (!companyResult || !companyResult.companyId) {
        throw new NotFoundException('You are not assigned to this company.');
      }
    } else if (user.role !== 'admin') {
      const companyResult = await this.externalApiService.getCrmCompany(
        user.userId,
        filterDto.companyId,
      );
      if (!companyResult || !companyResult.id) {
        throw new NotFoundException('You are not assigned to this company.');
      }
    }

    try {
      filterDto.fromDate = moment
        .tz(filterDto.fromDate.getTime(), 'Asia/Dhaka')
        .toDate();
      filterDto.toDate = moment
        .tz(filterDto.toDate.getTime(), 'Asia/Dhaka')
        .add(1, 'days')
        .toDate();
    } catch (err: any) {
      throw new BadRequestException('Invalid date range.');
    }

    if (filterDto.fromDate.getTime() >= filterDto.toDate.getTime()) {
      throw new BadRequestException('Invalid date range.');
    }

    const tripCountsResult = await this.getTripCounts(filterDto);
    const totalWeightResult = await this.getTotalVolumeWeight(filterDto);
    const avgLeadTimeResult = await this.getAverageLeadTime(filterDto);

    const result = new CompanyAnalyticsResultDto();
    result.tripCounts = tripCountsResult;
    result.additionalMetrics = new AdditionalMetricsResultDto();
    result.additionalMetrics.avgLeadTime = avgLeadTimeResult;
    result.additionalMetrics.totalWeight = totalWeightResult;

    if (
      tripCountsResult.requestedCount !== null &&
      tripCountsResult.completedCount !== null
    ) {
      result.additionalMetrics.avgFulfillmentRate = parseFloat(
        (
          (tripCountsResult.completedCount / tripCountsResult.requestedCount) *
          100.0
        ).toFixed(3),
      );
    }

    const routesMetricsResult = await this.getUsedRoutesWithAverageCost(
      filterDto,
    );
    let totalDistanceSum = 0;
    let totalRateSum = 0;

    for (let route of routesMetricsResult) {
      totalDistanceSum += route.totalDistance;
      totalRateSum += route.totalRate;

      let routeUsed = new RouteUsedResultDto();
      let routeCost = new RouteCostResultDto();

      Object.keys(route).map((key) => {
        if (routeUsed.hasOwnProperty(key)) {
          routeUsed[key] = route[key];
        }

        if (routeCost.hasOwnProperty(key)) {
          routeCost[key] = route[key];
        }
      });

      result.routesUsed.push(routeUsed);
      result.routesCost.push(routeCost);
    }

    if (routesMetricsResult.length > 0) {
      result.additionalMetrics.totalKm = totalDistanceSum;
      result.additionalMetrics.costPerKm = parseFloat(
        (totalRateSum / totalDistanceSum).toFixed(3),
      );
    } else {
      result.additionalMetrics.totalKm = null;
      result.additionalMetrics.costPerKm = null;
    }

    return result;
  }

  private async getTripCounts(
    filterDto: CompanyAnalyticsFilterDto,
  ): Promise<TripCountsResultDto> {
    const queryResult = await this.manager.query(
      `
      select 
        sum(sq."requestedCount")::int as "requestedCount",
        sum(sq."processingCount")::int as "processingCount",
        sum(
          sq."activatedCount" + 
          sq."loadedCount" + 
          sq."onWayCount"
        )::int as "activatedCount",
        sum(sq."unloadedCount" + sq."completedCount")::int as "completedCount",	
        sum(sq."cancelledCount")::int as "cancelledCount",
        sum(sq."expiredCount")::int as "expiredCount",
        sum(
          sq."requestedCount" - 
          sq."completedCount" - 
          sq."cancelledCount" - 
          sq."expiredCount" -
          sq."processingCount" -     
          sq."activatedCount" - 
          sq."loadedCount" - 
          sq."onWayCount" - 
          sq."unloadedCount"
        )::int as "remainingCount"
      from
        (
        select
          b.id,
          b."truckQuantity" as "requestedCount",
          sum(case when t."tripStatus" = 'completed' then 1 else 0 end) as "completedCount",
          sum(case when t."tripStatus" = 'cancelled' then 1 else 0 end) as "cancelledCount",
          sum(case when t."tripStatus" = 'expired' then 1 else 0 end) as "expiredCount",
          sum(case when (t."tripStatus" = 'processing' or t."tripStatus" = 'select_vendor' 
          or t."tripStatus" = 'get_truck_info') then 1 else 0 end) as "processingCount",
          sum(case when t."tripStatus" = 'activated' then 1 else 0 end) as "activatedCount",
          sum(case when t."tripStatus" = 'goods_loaded' then 1 else 0 end) as "loadedCount",
          sum(case when t."tripStatus" = 'on_way' then 1 else 0 end) as "onWayCount",
          sum(case when t."tripStatus" = 'goods_unloaded' then 1 else 0 end) as "unloadedCount"
        from
          bookings b
        left join 
          trips t  
        on
          b.id = t."bookingId"
        where
          ((b.company->>'id')::int = $1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = $1))
          and 
          b."createdAt" >= $2
          and 
          b."createdAt" < $3
        group by
          b.id
        ) as sq
      ;
      `,
      [filterDto.companyId, filterDto.fromDate, filterDto.toDate],
    );

    let result: TripCountsResultDto;
    if (queryResult && queryResult.length > 0) {
      result = plainToInstance(TripCountsResultDto, queryResult[0]);
    } else {
      result = new TripCountsResultDto();
    }
    return result;
  }

  private async getUsedRoutesWithAverageCost(
    filterDto: CompanyAnalyticsFilterDto,
  ): Promise<RouteMetricsResultDto[]> {
    const queryResult = await this.manager.query(
      `
      select 
        sq."fromDistrictName",
        sq."toDistrictName",
        sum(sq."requestedCount")::int as "requestedCount",
        sum(sq."completedCount")::int as "completedCount",
        round(avg(case when sq."completedCount" > 0 then sq."fareAmount" else null end)::numeric, 0)::float8 as "avgRate",
        sum(case when sq."completedCount" > 0 then sq."fareAmount" * sq."completedCount" else null end)::float8 as "totalRate",
        sum(case when sq."completedCount" > 0 then sq."distanceInKm" * sq."completedCount" else null end)::int as "totalDistance",
        min(case when sq."completedCount" > 0 then sq."fareAmount" else null end)::float8 as "minRate",
        max(case when sq."completedCount" > 0 then sq."fareAmount" else null end)::float8 as "maxRate"
      from 
        (
        select
          b.id as "bookingId",
          b."fromDistrict"#>>'{addressLocale,en}' as "fromDistrictName",
          b."toDistrict"#>>'{addressLocale,en}' as "toDistrictName",
          b."truckQuantity" as "requestedCount",
          b."tripCompleted" as "completedCount",
          b."distanceInKm" as "distanceInKm",          
          sum(case when fh."fareHistoryStatus" = 'shipper_approved' then fh."fareAmount" else 0 end) as "fareAmount"
        from
          bookings b
        left join 
          fare_histories fh 
        on
          b.id = fh."bookingId"
        where
          ((b.company->>'id')::int = $1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = $1))
          and 
          b."createdAt" >= $2
          and 
          b."createdAt" < $3
        group by
          b.id,
          b."fromDistrict"#>>'{addressLocale,en}',
          b."toDistrict"#>>'{addressLocale,en}',
          b."truckQuantity",
          b."tripCompleted"
        ) as sq
      group by 
        sq."fromDistrictName",
        sq."toDistrictName"	
      having
        sum(sq."completedCount") > 0
      order by 
        "completedCount" desc
      ;
      `,
      [filterDto.companyId, filterDto.fromDate, filterDto.toDate],
    );

    let resultSet: RouteMetricsResultDto[];
    if (queryResult && queryResult.length > 0) {
      resultSet = plainToInstance(RouteMetricsResultDto, queryResult as any[]);
    } else {
      resultSet = [];
    }
    return resultSet;
  }

  private async getTotalVolumeWeight(
    filterDto: CompanyAnalyticsFilterDto,
  ): Promise<number> {
    const queryResult = await this.manager.query(
      `
      select
        round(sum(
        case 
          when sq."unitName" = 'kg' then (sq."totalPerUnit" * 0.001) 
          when sq."unitName" = 'tonne' then sq."totalPerUnit"
          when sq."unitName" = 'lbs' then (sq."totalPerUnit" * 0.000453592)
          else 0
        end
        )::numeric, 3)::float8 as "totalWeight"
      from 	
        (
        select
          (jsonb_path_query_first(bi.measurements, '$ ? (@.name == "weight").unit.name') ->> 0) as "unitName",
          sum((jsonb_path_query_first(bi.measurements, '$ ? (@.name == "weight").value') ->> 0)::numeric) as "totalPerUnit"          
        from
          bookings b
        inner join 
          booking_items bi 
        on
          b.id = bi."bookingId"
        where
          ((b.company->>'id')::int = $1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = $1))
          and 
          b."bookingStatus" = 'completed'
          and 
          b."createdAt" >= $2
          and 
          b."createdAt" < $3
          and 
          bi.measurements @> '[{"name": "weight"}]'::jsonb
        group by
          "unitName"
        ) as sq 
      ;
      `,
      [filterDto.companyId, filterDto.fromDate, filterDto.toDate],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].totalWeight;
    }
    return result;
  }

  private async getAverageLeadTime(
    filterDto: CompanyAnalyticsFilterDto,
  ): Promise<number> {
    const queryResult = await this.manager.query(
      `
      select 
        round(avg(extract(epoch from (t."startedAt" - fh."updatedAt")) / 3600)::numeric, 3)::float8 as "avgLeadTime"
      from 
        bookings b
      inner join 
        fare_histories fh 
      on 
        b.id = fh."bookingId"
      inner join 
        trips t 
      on 
        b.id = t."bookingId"
      where
        ((b.company->>'id')::int = $1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = $1))
        and b."createdAt" >= $2
        and b."createdAt" < $3
        and fh."fareHistoryStatus" = 'shipper_approved'
        and t."startedAt" is not null
      ;
      `,
      [filterDto.companyId, filterDto.fromDate, filterDto.toDate],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].avgLeadTime;
    }
    return result;
  }
}
