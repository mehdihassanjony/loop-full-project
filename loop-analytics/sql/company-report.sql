--=============================================================================
-- 1) Get various trip counts like requested, processing, activated, completed, 
--    cancelled, expired, and remaining trips etc for a company in the given 
--    date range.
--=============================================================================

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
		((b.company->>'id')::int = 1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = 1))
		and 
		b."createdAt" >= '2022-08-01'
		and 
		b."createdAt" < '2022-08-08'
	group by
		b.id
	) as sq
;


--=============================================================================
-- 2) Count the most used route (loading to unloading point) along with average 
--    route cost for a specific company.
--=============================================================================

select 
	sq."fromDistrictName",
	sq."toDistrictName",
	sum(sq."requestedCount") as "requestedCount",
	sum(sq."completedCount") as "completedCount",
	round(avg(case when sq."completedCount" > 0 then sq."fareAmount" else null end)::numeric, 0) as "avgRate",
	sum(case when sq."completedCount" > 0 then sq."fareAmount" * sq."completedCount" else null end) as "totalRate",
	sum(case when sq."completedCount" > 0 then sq."distanceInKm" * sq."completedCount" else null end) as "totalDistance",
	count(case when sq."completedCount" > 0 then sq."fareAmount" else null end) as "rateCount",
	min(case when sq."completedCount" > 0 then sq."fareAmount" else null end) as "minRate",
	max(case when sq."completedCount" > 0 then sq."fareAmount" else null end) as "maxRate",
	sq."fromLatitude",
	sq."fromLongitude",
	sq."toLatitude",
	sq."toLongitude"
from 
	(
	select
		b.id as "bookingId",
		b."fromDistrict"#>>'{addressLocale,en}' as "fromDistrictName",
		b."toDistrict"#>>'{addressLocale,en}' as "toDistrictName",
		b."truckQuantity" as "requestedCount",
		b."tripCompleted" as "completedCount",
		b."distanceInKm" as "distanceInKm",
		sum(case when fh."fareHistoryStatus" = 'shipper_approved' then fh."fareAmount" else 0 end) as "fareAmount",
		b."fromDistrict"->>'latitude' as "fromLatitude",
		b."fromDistrict"->>'longitude' as "fromLongitude",
		b."toDistrict"->>'latitude' as "toLatitude",
		b."toDistrict"->>'longitude' as "toLongitude"
	from
		bookings b
	left join 
		fare_histories fh 
	on
		b.id = fh."bookingId"
	where
		((b.company->>'id')::int = 1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = 1))
		and 
		b."createdAt" >= '2022-08-01'
		and 
		b."createdAt" < '2022-08-08'
	group by
		b.id,
		b."fromDistrict"#>>'{addressLocale,en}',
		b."toDistrict"#>>'{addressLocale,en}',
		b."fromDistrict"->>'latitude',
		b."fromDistrict"->>'longitude',
		b."toDistrict"->>'latitude',
		b."toDistrict"->>'longitude',
		b."truckQuantity",
		b."tripCompleted"
	) as sq
group by 
	sq."fromDistrictName",
	sq."toDistrictName",
	sq."fromLatitude",
	sq."fromLongitude",
	sq."toLatitude",
	sq."toLongitude"	
having
	sum(sq."completedCount") > 0
order by 
	"completedCount" desc
;


--=============================================================================
-- 3) Total Volume (Weight) Shipped
--=============================================================================
select
	sum(
	case 
		when sq."unitName" = 'kg' then (sq."totalPerUnit" * 0.001) 
		when sq."unitName" = 'tonne' then sq."totalPerUnit"
		when sq."unitName" = 'lbs' then (sq."totalPerUnit" * 0.000453592)
		else 0
	end
	) as "totalWeight"
from 	
	(
	select
		(jsonb_path_query_first(bi.measurements, '$.unit.name') ->> 0) as "unitName",
		sum((jsonb_path_query_first(bi.measurements, '$.value') ->> 0)::numeric) as "totalPerUnit"
	from
		bookings b
	inner join 
		booking_items bi 
	on
		b.id = bi."bookingId"
	where
		((b.company->>'id')::int = 1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = 1))
		and 
		b."bookingStatus" = 'completed'
		and 
		b."createdAt" >= '2022-01-01'
		and 
		b."createdAt" < '2022-06-01'
		and 
		bi.measurements @> '[{"name": "weight"}]'::jsonb
	group by
		"unitName"
	) as sq 
;


--=============================================================================
-- 4) AVG lead time
--=============================================================================

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
    ((b.company->>'id')::int = 1 or ((b.company->'parentId') is not null and (b.company->>'parentId')::int = 1))
    and b."createdAt" >= '2022-08-01'
    and b."createdAt" < '2022-08-08'
    and fh."fareHistoryStatus" = 'shipper_approved'
    and t."startedAt" is not null
;
