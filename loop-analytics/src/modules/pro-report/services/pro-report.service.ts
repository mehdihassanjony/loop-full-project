import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ProReportFilterDto } from '../dtos/pro-report-filter.dto';
import { plainToInstance } from 'class-transformer';
import * as moment from 'moment-timezone';
import { ProReportTripCountsResultDto } from '../dtos/pro-report-trip-counts-result.dto';
import { ProReportActionCountsResultDto } from '../dtos/pro-report-action-counts-result.dto';
import { ProReportResultDto } from '../dtos/pro-report-result.dto';

@Injectable()
export class ProReportService {
  constructor(
    @InjectEntityManager()
    private bookingManager: EntityManager,
    private config: ConfigService,
  ) { }

  public async getBaseMetrics(filterDto: ProReportFilterDto) {
    if (!filterDto.proUserId) {
      throw new BadRequestException('PRO user-id is required.');
    }

    try {
      filterDto.fromDate = moment.tz(filterDto.fromDate.getTime(), 'Asia/Dhaka').toDate();
      filterDto.toDate = moment.tz(filterDto.toDate.getTime(), 'Asia/Dhaka').add(1, 'days').toDate();
    } catch (err: any) {
      throw new BadRequestException('Invalid date range.');
    }

    if (filterDto.fromDate.getTime() >= filterDto.toDate.getTime()) {
      throw new BadRequestException('Invalid date range.');
    }

    const tripCountsResult = await this.getBookingAndTripCounts(filterDto);
    const shipperQuotedCountResult = await this.getShipperQuotedCount(filterDto);
    const vendorSelectedCountResult = await this.getVendorSelectedCount(filterDto);
    const manualTripActivatedCountResult = await this.getManualTripActivatedCount(filterDto);
    const manualFareApprovedCountResult = await this.getManualFareApprovedCount(filterDto);
    const manualBiddingCountResult = await this.getManualBiddingCount(filterDto);

    const result = new ProReportResultDto();
    result.tripCounts = tripCountsResult;
    result.actionCounts = new ProReportActionCountsResultDto();
    result.actionCounts.shipperQuoted = shipperQuotedCountResult;
    result.actionCounts.vendorSelected = vendorSelectedCountResult;
    result.actionCounts.manualTripActivated = manualTripActivatedCountResult;
    result.actionCounts.manualFareApproved = manualFareApprovedCountResult;
    result.actionCounts.manualBidding = manualBiddingCountResult;

    return result;
  }

  private async getBookingAndTripCounts(
    filterDto: ProReportFilterDto,
  ): Promise<ProReportTripCountsResultDto> {
    const queryResult = await this.bookingManager.query(
      `
      select
        count(sq.id)::int as "createdBookings",
        sum(sq."createdTrips")::int as "createdTrips",
        sum(sq."activeTrips")::int as "activeTrips",
        sum(sq."completedTrips")::int as "completedTrips",	
        sum(sq."cancelledTrips")::int as "cancelledTrips",
        sum(sq."expiredTrips")::int as "expiredTrips"
      from
        (
        select
          b.id,
          b."truckQuantity" as "createdTrips",
          sum(case when t."tripStatus" = 'expired' then 1 else 0 end) as "expiredTrips",
          sum(case when (t."tripStatus" = 'activated' or t."tripStatus" = 'goods_loaded' or 
          t."tripStatus" = 'on_way') then 1 else 0 end) as "activeTrips",
          sum(case when (t."tripStatus" = 'goods_unloaded' or 
          t."tripStatus" = 'completed') then 1 else 0 end) as "completedTrips",
          sum(case when t."tripStatus" = 'cancelled' then 1 else 0 end) as "cancelledTrips"		
        from
          bookings b
        left join 
          trips t  
        on
          b.id = t."bookingId"
        where
          b."pickupDate" >= $1
          and 
          b."pickupDate" < $2
          and 
          b."createdBy"->>'userId' = $3
        group by
          b.id
        ) as sq
      ;      
      `,
      [filterDto.fromDate, filterDto.toDate, filterDto.proUserId],
    );

    let result: ProReportTripCountsResultDto;
    if (queryResult && queryResult.length > 0) {
      result = plainToInstance(ProReportTripCountsResultDto, queryResult[0]);
    } else {
      result = new ProReportTripCountsResultDto();
    }
    return result;
  }

  private async getShipperQuotedCount(
    filterDto: ProReportFilterDto,
  ): Promise<number> {
    const queryResult = await this.bookingManager.query(
      `
      select
        count(fh."bookingId")::int as "shipperQuotedCount"
      from 
        bookings b
      left join 
        fare_histories fh
      on 
        b.id = fh."bookingId"
      where
        b."pickupDate" >= $1
        and 
        b."pickupDate" < $2
        and	
        fh."requester"->>'userId' = $3
      ;        
      `,
      [filterDto.fromDate, filterDto.toDate, filterDto.proUserId],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].shipperQuotedCount;
    }
    return result;
  }

  private async getVendorSelectedCount(
    filterDto: ProReportFilterDto,
  ): Promise<number> {
    const queryResult = await this.bookingManager.query(
      `
      select
        count(b2."bookingId")::int as "vendorSelectedCount"
      from 
        bookings b
      left join
          biddings b2
      on 
        b.id = b2."bookingId"
      where
        b."pickupDate" >= $1
        and 
        b."pickupDate" < $2
        and	
        b2.confirmed = true 
        and
        b2."confirmedBy"->>'userId' = $3
      ;
      `,
      [filterDto.fromDate, filterDto.toDate, filterDto.proUserId],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].vendorSelectedCount;
    }
    return result;
  }

  private async getManualTripActivatedCount(
    filterDto: ProReportFilterDto,
  ): Promise<number> {
    const queryResult = await this.bookingManager.query(
      `
      select
        count(t."bookingId")::int as "manualTripActivatedCount"
      from 
        bookings b
      left join
          trips t
      on 
        b.id = t."bookingId"
      where
        b."pickupDate" >= $1
        and 
        b."pickupDate" < $2
        and	
        t."activatedBy"->>'userId' = $3
      ;        
      `,
      [filterDto.fromDate, filterDto.toDate, filterDto.proUserId],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].manualTripActivatedCount;
    }
    return result;
  }

  private async getManualFareApprovedCount(
    filterDto: ProReportFilterDto,
  ): Promise<number> {
    const queryResult = await this.bookingManager.query(
      `
      select
        count(fh."bookingId")::int as "manualFareApprovedCount"
      from 
        bookings b
      left join 
        fare_histories fh
      on 
        b.id = fh."bookingId"
      where
        b."pickupDate" >= $1
        and 
        b."pickupDate" < $2
        and	
        fh."fareHistoryStatus" = 'shipper_approved'
        and 
        fh."updatedBy"->>'userId' = $3
      ;        
      `,
      [filterDto.fromDate, filterDto.toDate, filterDto.proUserId],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].manualFareApprovedCount;
    }
    return result;
  }

  private async getManualBiddingCount(
    filterDto: ProReportFilterDto,
  ): Promise<number> {
    const queryResult = await this.bookingManager.query(
      `
      select
        count(b2."bookingId")::int as "manualBiddingCount"
      from 
        bookings b
      left join
          biddings b2
      on 
        b.id = b2."bookingId"
      where
        b."pickupDate" >= $1
        and 
        b."pickupDate" < $2
        and	
        b2."createdBy"->>'userId' = $3
      ;
      `,
      [filterDto.fromDate, filterDto.toDate, filterDto.proUserId],
    );

    let result: number | null = null;
    if (queryResult && queryResult.length > 0) {
      result = queryResult[0].manualBiddingCount;
    }
    return result;
  }

}
