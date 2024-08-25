import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { MB_DATABASE } from 'src/common/constants';
import { UserRole, UserType } from 'src/common/decorators/user.decorator';
import { EntityManager } from 'typeorm';
import { HistoryChartQueryDto } from '../dtos/history-chart-query.dto';
import { SummaryQueryDto } from '../dtos/summary-query.dto';
import { TopShipperQueryDto } from '../dtos/top-shippers-query.dto';
import { TopVendorQueryDto } from '../dtos/top-vendor-query.dto';

@Injectable()
export class MetricsService {
  constructor(
    @InjectEntityManager(MB_DATABASE)
    private mbManager: EntityManager,
    @InjectEntityManager()
    private bookingManager: EntityManager,
  ) {}

  public async getSummary(user: UserType, query: SummaryQueryDto) {
    const successAcceptanceRate = await this.averageSuccessAcceptanceRate(
      user,
      query,
    );

    return {
      avgBiddingRate: await this.averageBiddingRate(user, query),
      // avgSuccessRate: await this.averageSuccessRate(user, query),
      // acceptanceRate: await this.averageAcceptanceRate(user, query),
      avgSuccessRate: successAcceptanceRate.success_rate,
      acceptanceRate: successAcceptanceRate.acceptance_rate,
      tripsCreatedToday: await this.totalTripsCreatedToday(user, query),
      funnel: await this.getFunnelFlow(user, query),
    };
  }

  public async getTopShippers(user: UserType, query: TopShipperQueryDto) {
    if (query.chUserId && user.role === UserRole.CLUSTER_HEAD) {
      throw new ForbiddenException('Only admin and gm can pass query chUserId');
    }

    let queryParams: any[] = [(query.page - 1) * query.count, query.count];

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      queryParams.push(query.chUserId || user.userId);
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
			select 
				sq1.company_name,
				(case
					when sq2.trip_benchmark is null then 0
					else sq2.trip_benchmark
				end) as trip_benchmark,	
				(case
					when sq2.current_trips is null then 0
					else sq2.current_trips
				end) as current_trips,
				round(((case
					when sq2.current_trips is null then 0
					else sq2.current_trips
				end) / 
				(case
					when sq2.trip_benchmark is null then 1
					when sq2.trip_benchmark = 0 then 1
					else sq2.trip_benchmark
				end) * 
				100.0
				)::numeric, 2) as trip_rate
			from
				(
				select 
					c2.id as company_id,
					c2."name" as company_name
				from 
					crm c
				inner join 
					company c2  
				on 
					c.id = c2.cluster_head_id 
				where
				  c2.created_at < ${
            nextDate
              ? `'${nextDate.toISOString()}'::timestamp`
              : `date_trunc('month', now() + interval '1 month')`
          }
		`;

    if (queryParams.length > 2) {
      baseQuery = baseQuery + ' and c.user_id = $3';
    }

    baseQuery =
      baseQuery +
      `
			group by 
						c2.id  
					) as sq1
				left join
					(
					select 
						sq1.company_id,
						max(sq1.month_trips)::float8 as trip_benchmark,
						max(case 
							when sq1.trip_month = ${
                query.date
                  ? `to_char(timestamp '${query.date.toISOString()}', 'YYYY-MM')`
                  : `to_char(now() - interval '1 month', 'YYYY-MM')`
              }
							then sq1.month_trips 
							else 0 
						end)::float8 as current_trips
					from 
						(
						select
							b.company_id,
							to_char(b.created_at, 'YYYY-MM') as trip_month,
							sum(b.trip_completed) as month_trips
						from 
							bookings b 				
						group by
							b.company_id,
							to_char(b.created_at, 'YYYY-MM')
						) as sq1
					group by 
						sq1.company_id
					) as sq2 
				on 
					sq1.company_id = sq2.company_id 
				order by 
					current_trips desc
				offset $1
				limit $2
				;
		`;

    // ${
    // 	query.date
    // 		? `where b.created_at >= '${query.date.toISOString()}'::timestamp and b.created_at < '${nextDate.toISOString()}'::timestamp`
    // 		: ''
    // }

    let totalQuery = 'select count(*) from company';

    if (user.role === UserRole.CLUSTER_HEAD) {
      totalQuery = `select count(*) from company inner join crm on crm.id=company.cluster_head_id where crm.user_id = '${user.userId}'`;
    }

    let [total] = await this.mbManager.query(totalQuery);

    let result = await this.mbManager.query(baseQuery, queryParams);

    return {
      page: query.page,
      count: query.count,
      total: total?.count,
      result,
    };
  }

  public async getTopVendors(user: UserType, query: TopVendorQueryDto) {
    if (query.chUserId && user.role === UserRole.CLUSTER_HEAD) {
      throw new ForbiddenException('Only admin and gm can pass query chUserId');
    }

    let queryParams: any[] = [(query.page - 1) * query.count, query.count];

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      queryParams.push(query.chUserId || user.userId);
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
				select 
					sq1.vendor_name,
					(case
						when sq3.number_of_feeds is null then 0
						else sq3.number_of_feeds
					end) as number_of_feeds,
					round(((case
						when sq3.organic_trip_bidding is null then 0
						else sq3.organic_trip_bidding
					end) / 
					(case
						when sq3.trip_received is null then 1
						when sq3.trip_received = 0 then 1
						else sq3.trip_received
					end) * 
					100.0
					)::numeric, 2) as organic_bidding_rate,
					round(((case
						when sq3.trip_activated is null then 0
						else sq3.trip_activated
					end) / 
					(case
						when sq3.trip_accepted is null then 1
						when sq3.trip_accepted = 0 then 1
						else sq3.trip_accepted
					end) * 
					100.0
					)::numeric, 2) as activation_rate,
					round(((case
						when sq3.trip_completed is null then 0
						else sq3.trip_completed
					end) / 
					(case
						when sq3.trip_accepted is null then 1
						when sq3.trip_accepted = 0 then 1
						else sq3.trip_accepted
					end) * 
					100.0
					)::numeric, 2) as success_rate	
				from
					(
					select 
						v.id as vendor_id,
						v.full_name as vendor_name
					from 
						vendors v
					inner join 
						supplier_crm vk 
					on 
						v.id = vk.supplier_id
					where
						v.created_at <= ${
              nextDate
                ? `'${nextDate.toISOString()}'::timestamp`
                : `date_trunc('month', now() + interval '1 month')`
            }
		`;

    if (queryParams.length > 2) {
      baseQuery =
        baseQuery + 'and vk.cluster_user_id = $3 and vk.is_active = true';
    }

    baseQuery =
      baseQuery +
      `
				group by 
						v.id 
					) as sq1
				left join 
					(
					select 
						sq2.vendor_id as vendor_id,
						count(sq2.booking_id) as number_of_feeds,
						sum(sq2.trip_received)::float8 as trip_received,
						sum(sq2.trip_bidding)::float8 as trip_bidding,
						sum(sq2.organic_trip_bidding)::float8 as organic_trip_bidding,
						sum(sq2.trip_accepted)::float8 as trip_accepted,
						sum(sq2.trip_activated)::float8 as trip_activated,
						sum(sq2.trip_completed)::float8 as trip_completed		
					from
						(
						select 
							v2.id as vendor_id,
							b.id as booking_id,
							b.truck_quantity as trip_received,	
							max(case 
								when b2.id is not null then b2.number_of_trucks 
								else 0 
							end)::float8 as trip_bidding,
							max(case 
								when b2.created_by_user_id = b2.vendor_user_id then b2.number_of_trucks 
								else 0 
							end)::float8 as organic_trip_bidding,			
							max(case 
								when b2.bidding_status = 'accepted' then b2.number_of_trucks 
								else 0 
							end) as trip_accepted,
							sum(
							case 
								when b2.bidding_status = 'accepted' and 
								t.started_at is not null then 1 
								else 0 
							end) as trip_activated,
							sum(case 
								when b2.bidding_status = 'accepted' and 
								t.trip_status = 'completed' then 1 
								else 0 
							end) as trip_completed				
						from
							(
								vendors v2
							inner join 
								vendor_responses vr 
							on 
								v2.user_id = vr.user_id 
							inner join 
								bookings b 
							on 
								vr.booking_id = b.id 
							)
						left join 
							biddings b2 
						on 
							b.id = b2.booking_id and b2.vendor_user_id = v2.user_id 
						left join 
							trips t 
						on 
							b2.id = t.bidding_id 
						where
							b.created_at >= ${
                query.date
                  ? `'${query.date.toISOString()}'::timestamp`
                  : `date_trunc('month', now())`
              }
							and 
							b.created_at < ${
                nextDate
                  ? `'${nextDate.toISOString()}'::timestamp`
                  : `date_trunc('month', now() + interval '1 month')`
              }
						group by 
							v2.id,
							b.id
						) as sq2
					group by 
						sq2.vendor_id
					) as sq3
				on
					sq1.vendor_id = sq3.vendor_id  
				order by 
					organic_bidding_rate desc
				offset $1
				limit $2
				;
			`;

    let totalQuery = 'select count(*) from vendors';

    if (user.role === UserRole.CLUSTER_HEAD) {
      totalQuery = `select count(*) from vendors v inner join supplier_crm c on v.id = c.supplier_id where c.cluster_user_id = '${user.userId}'`;
    }

    let [total] = await this.mbManager.query(totalQuery);

    let result = await this.mbManager.query(baseQuery, queryParams);

    return {
      page: query.page,
      count: query.count,
      total: total?.count,
      result,
    };
  }

  public async getHistoryChart(user: UserType, query: HistoryChartQueryDto) {
    if (query.chUserId && user.role === UserRole.CLUSTER_HEAD) {
      throw new ForbiddenException('Only admin and gm can pass query chUserId');
    }

    const prevDate = this.getSixMonPrevDate(query.date);

    let baseQuery = `
				select 
					to_char(b.created_at, 'YYYY-MM') as trip_month, 
					sum(b.trip_completed) as trip_completed
				from
					bookings b
				where 
		`;

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery =
        baseQuery +
        `b.cluster_head_user_id = '${query.chUserId || user.userId}' and`;
    }

    baseQuery += `
				b.created_at >= ${
          prevDate
            ? `'${prevDate.toISOString()}'::timestamp`
            : `date_trunc('month', now() - interval '6 month')`
        }
				and 
				b.created_at < ${
          query.date
            ? `'${query.date.toISOString()}'::timestamp`
            : `date_trunc('month', now())`
        }
				group by 
					to_char(b.created_at, 'YYYY-MM')
				order by 
					trip_month
				;
		`;

    const result = await this.mbManager.query(baseQuery);

    let max = 0;

    for (let i = 0; i < result.length; i++) {
      if (parseInt(result[i].trip_completed) > max) {
        max = result[i].trip_completed;
      }
    }

    return {
      max,
      result,
    };
  }

  private async getFunnelFlow(user: UserType, query: SummaryQueryDto) {
    if (user.role === UserRole.CLUSTER_HEAD && query.chUserId) {
      throw new ForbiddenException(
        'Only admin and gm can query using chUserId',
      );
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
			select 
				sum(sq1.trip_requested) as "dailyTripFlow",
				sum(sq1.trip_quoted) as "quotation",
				sum(sq1.trip_approved) as "rateAccepted",
				sum(sq1.trip_completed) as "successfulTrips"
			from 
				(
				select distinct on (b.id)
					b.id as booking_id,
					fh.id as fare_id,
					b."truckQuantity" as trip_requested,
					(case 
						when fh."fareHistoryStatus" = 'pending' then b."truckQuantity" 
						when fh."fareHistoryStatus" = 'shipper_approved' then b."truckQuantity" 
						else 0 
					end) as trip_quoted,	
					(case 
						when fh."fareHistoryStatus" = 'shipper_approved' then b."truckQuantity" 
						else 0 
					end) as trip_approved,
					b."tripCompleted" as trip_completed
				from
					bookings b
				left join 
					fare_histories fh 
				on
					b.id = fh."bookingId"
				where 
		`;

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery += `b."clusterHead"->>'userId' = '${
        query.chUserId || user.userId
      }' and`;
    }

    baseQuery += `
				b."createdAt" >= ${
          query.date
            ? `'${query.date.toISOString()}'::timestamp`
            : `date_trunc('month', now())`
        }
				and 
				b."createdAt" < ${
          nextDate
            ? `'${nextDate.toISOString()}'::timestamp`
            : `date_trunc('month', now() + interval '1 month')`
        }
				group by
					b.id,
					fh.id
				order by
					b.id asc,
					fh.id desc
				) as sq1
			;	
		`;

    let [result] = await this.bookingManager.query(baseQuery);

    return result;
  }

  private async totalTripsCreatedToday(user: UserType, query: SummaryQueryDto) {
    if (user.role === UserRole.CLUSTER_HEAD && query.chUserId) {
      throw new ForbiddenException(
        'Only admin and gm can query using chUserId',
      );
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
				select
					(case 
						when sum(b."truckQuantity") is null then 0 
						else sum(b."truckQuantity") 
					end) as trips_created_today
				from 
					bookings b
				where
		`;
    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery += `b."clusterHead"->>'userId' = '${
        query.chUserId || user.userId
      }' and `;
    }

    baseQuery += `
				b."createdAt" >= ${
          query.date
            ? `'${query.date.toISOString()}'::timestamp`
            : `date_trunc('month', now())`
        }
				and 
				b."createdAt" < ${
          nextDate
            ? `'${nextDate.toISOString()}'::timestamp`
            : `date_trunc('month', now() + interval '1 month')`
        }
				;
		`;

    let [result] = await this.bookingManager.query(baseQuery);

    return result?.trips_created_today;
  }

  private async averageAcceptanceRate(user: UserType, query: SummaryQueryDto) {
    if (user.role === UserRole.CLUSTER_HEAD && query.chUserId) {
      throw new ForbiddenException(
        'Only admin and gm can query using chUserId',
      );
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
				select 
					avg(((case
						when sq2.trip_accepted is null then 0
						else sq2.trip_accepted
					end) / 
					(case
						when sq2.trip_bidding is null then 1
						when sq2.trip_bidding = 0 then 1
						else sq2.trip_bidding
					end) * 
					100.0
					)::float8) as acceptance_rate
				from
					(
					select 
						v.user_id as vendor_user_id
					from 
						vendors v
					inner join 
						supplier_crm vk 
					on 
						v.id = vk.supplier_id 
					where 
			`;

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery += `vk.cluster_user_id = '${
        query.chUserId || user.userId
      }' and vk.is_active = true and`;
    }

    baseQuery += `
					v.created_at < ${
            nextDate
              ? `'${nextDate.toISOString()}'::timestamp`
              : `date_trunc('month', now() + interval '1 month')`
          }
						group by 
							v.id  
						) as sq1
					left join 
						(
						select 
							b2.vendor_user_id as vendor_user_id,
							sum(b2.number_of_trucks) as trip_bidding,
							sum(case 
								when b2.bidding_status = 'accepted' then b2.number_of_trucks 
								else 0 
							end)::float8 as trip_accepted
						from
							bookings b
						inner join 
							biddings b2 
						on 
							b.id = b2.booking_id  
						where
							b.created_at >= ${
                query.date
                  ? `'${query.date.toISOString()}'::timestamp`
                  : `date_trunc('month', now())`
              }
							and 
							b.created_at < ${
                nextDate
                  ? `'${nextDate.toISOString()}'::timestamp`
                  : `date_trunc('month', now() + interval '1 month')`
              }
						group by
							b2.vendor_user_id
						) as sq2
					on
						sq1.vendor_user_id = sq2.vendor_user_id  
			;
		`;

    let [result] = await this.mbManager.query(baseQuery);

    return result?.acceptance_rate;
  }

  private async averageSuccessRate(user: UserType, query: SummaryQueryDto) {
    if (user.role === UserRole.CLUSTER_HEAD && query.chUserId) {
      throw new ForbiddenException(
        'Only admin and gm can query using chUserId',
      );
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
			select 
				avg(((case
					when sq3.booking_completed is null then 0
					else sq3.booking_completed
				end) / 
				(case
					when sq3.booking_approved is null then 1
					when sq3.booking_approved = 0 then 1
					else sq3.booking_approved
				end) * 
				100.0
				)::float8) as avg_success_rate
			from
				(
				select 
					c2.id as company_id
				from 
					crm c
				inner join 
					company c2  
				on 
					c.id = c2.cluster_head_id `;

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery += `where c.user_id = '${query.chUserId || user.userId}'`;
    }

    baseQuery += `
				group by 
						c2.id  
					) as sq1
				left join 
					(
					select 
						sq2.company_id as company_id,
						sum(sq2.booking_approved) as booking_approved,
						sum(sq2.trip_completed / sq2.trip_received)::float8 as booking_completed		
					from
						(
						select
							b.company_id as company_id,
							b.truck_quantity as trip_received,
							sum(
							case 
								when fh.fare_history_status = 'shipper_approved' then 1 
								else 0 
							end) as booking_approved,
							b.trip_completed as trip_completed
						from
							bookings b
						inner join 
							fare_histories fh 
						on
							b.id = fh.booking_id
						where
							b.created_at >= ${
                query.date
                  ? `'${query.date.toISOString()}'::timestamp`
                  : `date_trunc('month', now())`
              }
							and 
							b.created_at < ${
                nextDate
                  ? `'${nextDate.toISOString()}'::timestamp`
                  : `date_trunc('month', now() + interval '1 month')`
              }
						group by
							b.company_id,
							b.id
					) as sq2
				group by 
					sq2.company_id
				) as sq3 
			on
				sq1.company_id = sq3.company_id  
			;
			`;

    const [result] = await this.mbManager.query(baseQuery);

    return result?.avg_success_rate;
  }

  private async averageBiddingRate(user: UserType, query: SummaryQueryDto) {
    if (user.role === UserRole.CLUSTER_HEAD && query.chUserId) {
      throw new ForbiddenException(
        'Only admin and gm can query using chUserId',
      );
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
			select 
				avg(((case
					when sq3.trip_bidding is null then 0
					else sq3.trip_bidding
				end) / 
				(case
					when sq3.trip_received is null then 1
					when sq3.trip_received = 0 then 1
					else sq3.trip_received
				end) * 
				100.0
				)::float8) as bidding_rate 
			from
				(
				select 
					v.id as vendor_id
				from 
					vendors v
				inner join 
					supplier_crm vk 
				on 
					v.id = vk.supplier_id 
				where 
			`;

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery += `vk.cluster_user_id = '${
        query.chUserId || user.userId
      }' and vk.is_active = true and`;
    }

    baseQuery += `	
				v.created_at <= ${
          nextDate
            ? `'${nextDate.toISOString()}'::timestamp`
            : `date_trunc('month', now() + interval '1 month')`
        }
				group by 
					v.id 
				) as sq1
				left join 
				(
				select 
					sq2.vendor_id as vendor_id,
					sum(sq2.trip_received)::float8 as trip_received,
					sum(sq2.trip_bidding)::float8 as trip_bidding
				from
					(
					select 
						v2.id as vendor_id,
						b.truck_quantity as trip_received,
						sum(case 
							when b2.created_by_user_id = b2.vendor_user_id then b2.number_of_trucks 
							else 0 
						end)::float8 as trip_bidding
					from
						(
							vendors v2
						inner join 
							vendor_responses vr 
						on 
							v2.user_id = vr.user_id 
						inner join 
							bookings b 
						on 
							vr.booking_id = b.id 
						)
					left join 
						biddings b2 
					on 
						b.id = b2.booking_id and b2.vendor_user_id = v2.user_id 
					where
						b.created_at >= ${
              query.date
                ? `'${query.date.toISOString()}'::timestamp`
                : `date_trunc('month', now())`
            }
						and 
						b.created_at < ${
              nextDate
                ? `'${nextDate.toISOString()}'::timestamp`
                : `date_trunc('month', now() + interval '1 month')`
            }
					group by 
						v2.id,
						b.id
					) as sq2
				group by 
					sq2.vendor_id
				) as sq3
			on
				sq1.vendor_id = sq3.vendor_id  
			where 
				sq3.vendor_id is not null 
			;
		`;

    let [result] = await this.mbManager.query(baseQuery);

    return result?.bidding_rate;
  }

  private getNextDate(date: Date | undefined): Date {
    if (!date) {
      return null;
    }

    const currentMonth = date.getMonth();

    const copy: Date = new Date(date);

    copy.setMonth(currentMonth + 1);

    return copy;
  }

  private getSixMonPrevDate(date: Date | undefined) {
    if (!date) {
      return null;
    }

    const currentMonth = date.getMonth();

    const copy: Date = new Date(date);

    copy.setMonth(
      currentMonth - 6 >= 0 ? currentMonth - 6 : currentMonth - 6 + 12,
    );

    return copy;
  }

  private async averageSuccessAcceptanceRate(
    user: UserType,
    query: SummaryQueryDto,
  ) {
    if (user.role === UserRole.CLUSTER_HEAD && query.chUserId) {
      throw new ForbiddenException(
        'Only admin and gm can query using chUserId',
      );
    }

    const nextDate: Date = this.getNextDate(query.date);

    let baseQuery = `
			select 
				((trip_quoted / trip_requested::float8) * 100)::float8 quotation_rate,
				((trip_approved / trip_requested::float8) * 100)::float8 acceptance_rate, 
				((trip_completed / trip_requested::float8) * 100)::float8 success_rate
			from 
				(
				select 
					sum(sq1.trip_requested)::float8 as trip_requested,
					sum(sq1.trip_quoted)::float8 as trip_quoted,
					sum(sq1.trip_approved)::float8 as trip_approved,
					sum(sq1.trip_completed)::float8 as trip_completed
				from 
					(
					select distinct on (b.id)
						b.id as booking_id,
						fh.id as fare_id,
						b.truck_quantity as trip_requested,
						(case 
							when fh.fare_history_status = 'pending' then b.truck_quantity 
							when fh.fare_history_status = 'shipper_approved' then b.truck_quantity 
							else 0 
						end) as trip_quoted,	
						(case 
							when fh.fare_history_status = 'shipper_approved' then b.truck_quantity 
							else 0 
						end) as trip_approved,
						b.trip_completed as trip_completed
					from
						bookings b
					left join 
						fare_histories fh 
					on
						b.id = fh.booking_id
					where 					
			`;

    if (user.role === UserRole.CLUSTER_HEAD || query.chUserId) {
      baseQuery += `b.cluster_head_user_id = '${
        query.chUserId || user.userId
      }' and`;
    }

    baseQuery += `
					b.created_at >= ${
            query.date
              ? `'${query.date.toISOString()}'::timestamp`
              : `date_trunc('month', now())`
          }
					and 
					b.created_at < ${
            nextDate
              ? `'${nextDate.toISOString()}'::timestamp`
              : `date_trunc('month', now() + interval '1 month')`
          }
						group by 
							b.id,
							fh.id
						order by 
							b.id asc,
							fh.id desc
					) as sq1
			) as sq2
			;
			`;

    const [result] = await this.mbManager.query(baseQuery);

    return result;
  }
}
