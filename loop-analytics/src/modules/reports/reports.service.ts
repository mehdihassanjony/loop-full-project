import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as moment from 'moment-timezone';
import { MonthlyOrderAnalyticsDto } from './dtos/monthly-order-analytics.dto';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private connection: DataSource) {}

  public async chTripReportMonthly() {
    const fromDate = moment()
      .startOf('months')
      .set({
        hours: 0,
        minutes: 0,
        seconds: 0,
      })
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    const toDate = moment()
      .endOf('months')
      .set({
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      })
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    const report = await this.connection.query(
      `
        select * from
            (select
                sq."fullName" as "fullName",
                sum(sq.completed)::int as "completed"
            from (
                select 
                TRIM(b."clusterHead"->>'fullName') as "fullName",
                count(t.id) as "completed"
              from trips t
            left join bookings b on b.id = t."bookingId"
            where t."endedAt" between $1 and $2
            group by t.id, b."clusterHead") as sq
            group by "fullName") as oq
        order by oq."completed" desc`,
      [fromDate, toDate],
    );
    return report;
  }

  public async chTripReportDaily() {
    const fromDate = moment()
      .set({
        hours: 0,
        minutes: 0,
        seconds: 0,
      })
      .format('YYYY-MM-DD HH:mm:ss');

    const toDate = moment()
      .set({
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      })
      .format('YYYY-MM-DD HH:mm:ss');

    const report = await this.connection.query(
      `
        select * from
            (select
                sq."fullName" as "fullName",
                sum(sq.completed)::int as "completed"
            from
                    (select
                    b."clusterHead"->>'fullName' as "fullName",
                    count(t.id) as "completed"
                from trips t
            left join bookings b on b.id = t."bookingId"
            where t."endedAt" between $1 and $2
            group by t.id, b."clusterHead") as sq
            group by "fullName") as oq
        order by oq."completed" desc`,
      [fromDate, toDate],
    );
    return report;
  }

  public async chMonthlyOrderAnalytics(q: MonthlyOrderAnalyticsDto) {
    const fromDate = moment()
      .startOf('months')
      .set({
        hours: 0,
        minutes: 0,
        seconds: 0,
      })
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    const toDate = moment()
      .endOf('months')
      .set({
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      })
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    const report = await this.connection.query(
      `select
                sq."companyName" as "companyName",
                sq."chFullName" as "chFullName",
                sum(sq."requestedBooking")::int as "requestedBooking",
                sum(sq."shipperApproved")::int as "shipperApproved",
                sum(sq."completedBooking")::int as "completedBooking",
                sum(sq."cancelledBooking")::int as "cancelledBooking",
                sum(sq."expiredBooking")::int as "expiredBooking",

                sum(sq."processingTrip")::int as "processingTrip",
                sum(sq."quoteShipper")::int as "quoteShipper",
                sum(sq."selectVendor")::int as "selectVendor",
                sum(sq."getTruckInfo")::int as "getTruckInfo",
                sum(sq."completedTrip")::int as "completedTrip",
                sum(sq."cancelledTrip")::int as "cancelledTrip",
                sum(sq."expitedTrip")::int as "expitedTrip",
                sum(sq."activated")::int as "activated"
          from (select
            b."company"->>'name' as "companyName",
            b."clusterHead"->>'fullName' as "chFullName",
            (case when b."bookingStatus"='look_at_bid' then 1 else 0 end) as "requestedBooking",
            (case when b."bookingStatus"='quote_shipper' then 1 else 0 end) as "quoteShipper",
            (case when b."bookingStatus"='shipper_approved' then 1 else 0 end) as "shipperApproved",
            (case when b."bookingStatus"='completed' then 1 else 0 end) as "completedBooking",
            (case when b."bookingStatus"='cancelled' then 1 else 0 end) as "cancelledBooking",
            (case when b."bookingStatus"='expired' then 1 else 0 end) as "expiredBooking",

            sum(case when t."tripStatus"='processing' then 1 else 0 end) as "processingTrip",
            sum(case when t."tripStatus"='select_vendor' then 1 else 0 end) as "selectVendor",
            sum(case when t."tripStatus"='get_truck_info' then 1 else 0 end) as "getTruckInfo",
            sum(case when t."tripStatus"='completed' then 1 else 0 end) as "completedTrip",
            sum(case when t."tripStatus"='cancelled' then 1 else 0 end) as "cancelledTrip",
            sum(case when t."tripStatus"='expired' then 1 else 0 end) as "expitedTrip",
            sum(case when (t."tripStatus"='activated' OR t."tripStatus"='on_way') then 1 else 0 end) as "activated"
      from bookings b
      left join trips t on b.id = t."bookingId"
      where b."clusterHead"->>'userId'=$1 and t."endedAt" between $2 and $3
      group by b.id) as sq
      group by sq."companyName",sq."chFullName";`,
      [q.userId, fromDate, toDate],
    );
    return report;
  }
}
