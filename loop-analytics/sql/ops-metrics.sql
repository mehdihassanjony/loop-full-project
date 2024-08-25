--=============================================================================
-- 1) Trips created/requested in month
--=============================================================================

select
	(case 
		when sum(b.truck_quantity) is null then 0 
		else sum(b.truck_quantity) 
	end) as trips_created_today
from 
	bookings b
where 
--	b.cluster_head_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
--	and 
	b.created_at >= '2022-11-01' 
	and 
	b.created_at < '2022-12-01'	
;


--=============================================================================
-- 2+3) Acceptance Rate, Success Rate
--=============================================================================

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
    --		b.cluster_head_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
    --		and 
    		b.created_at >= '2022-11-01'
    		and 
    		b.created_at < '2022-12-01'
    	group by 
    		b.id,
    		fh.id
    	order by 
    		b.id asc,
    		fh.id desc
    	) as sq1
	) as sq2
;


--=============================================================================
-- 2.1) AVG acceptance rate
--=============================================================================

--- a. supply crm join because of we consider cluster assigned vendors only,
--- b. resone of left join every vendors didn't bid and get trips,
--- c. accepatance rate = trip_accepted/trip_bidding,

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
		v.user_id as vendor_user_id,
		v.full_name as vendor_name
	from 
		vendors v
	inner join 
		supplier_crm vk 
	on 
		v.id = vk.supplier_id 
	where
		v.created_at < '2022-12-01'
--		and
--		vk.cluster_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
--		and 
--		vk.is_active = true 
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
		b.created_at >= '2022-11-01'
		and 
		b.created_at < '2022-12-01'
	group by
		b2.vendor_user_id
	) as sq2
on
	sq1.vendor_user_id = sq2.vendor_user_id 
;


--=============================================================================
-- 3.1) AVG success rate (FFT)
--=============================================================================

--- a. booking completed = trip_completed/trip_recived because every recived trip doesn't 
---    completed. so here we comsider a booking completed ratio,
--- b. avg_success_rate = booking_completed/booking_approved, 
--- c. if fare_history_status is shipper_approved then this booking will approved,
--- d. The resone of the left join, every company dosen't create booking,

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
		c.id = c2.cluster_head_id 
	where
		c2.created_at < '2022-12-01'
--		and
--		c.user_id = '01FWZKXMMK0H49YT4BPVH539KG'
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
			sum(case 
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
			b.created_at >= '2022-11-01'
			and 
			b.created_at < '2022-12-01'
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


--=============================================================================
-- 5) AVG bidding rate (VAT)
--=============================================================================

--- a. bidding_rate = trip_bidding/trip_recived, here trips 
---    bidding must be done by organic way,
--- b. supply crm join because of we consider only cluster assigned vendors,
--- c. we doesn't consider thous vendors who didn't recived any feed
--- d. 

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
		v.created_at < '2022-12-01'
--		and
--		vk.cluster_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
--		and 
--		vk.is_active = true 
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
			b.created_at >= '2022-11-01'
			and 
			b.created_at < '2022-12-01'
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


--=============================================================================
-- 6) Flunnel from in-flow trips to completed trips
--=============================================================================

--- a. if fare_history_status is pending or shipper_approved then this booking was quoted,
--- b. if fare_history_status is shipper_approved this booking was aproved, 
---  

select 
	sum(sq1.trip_requested) as trip_requested,
	sum(sq1.trip_quoted) as trip_quoted,
	sum(sq1.trip_approved) as trip_approved,
	sum(sq1.trip_completed) as trip_completed
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
--		b.cluster_head_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
--		and 
		b.created_at >= '2022-11-01'
		and 
		b.created_at < '2022-12-01'
	group by 
		b.id,
		fh.id
	order by 
		b.id asc,
		fh.id desc
	) as sq1
;


--=============================================================================
-- 7) Top shippers by trips
--=============================================================================

--- a. trip banchmark clculated 
---    by his life time monthly best number of trip completed,
--- b. trip_rate is comperassion of current month cmpleted trip 
---     with best month completed trips,
--- 

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
		c2.created_at < '2022-12-01'
--		and
--		c.user_id = '01FWZKXMMK0H49YT4BPVH539KG'
	group by 
		c2.id  
	) as sq1
left join
	(
	select 
		sq1.company_id,
		max(sq1.month_trips)::float8 as trip_benchmark,
		max(case 
			when sq1.trip_month = to_char(timestamp '2022-11-01', 'YYYY-MM') 
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
;


-- =============================================================================
-- 8) Top vendors by bids
-- =============================================================================

--- a. supply crm join because of we consider only cluster assigned vendors,
--- b. we doesn't consider thous vendors who didn't recived any feed
--- c. bidding_rate clculated organic_trip_bidding/trip_received
--- d. success_rate clculated trip_activated/trip_accepted
--- e. if bidding status accepted then trip was accepted
--- f. if bidding status accepted and trips started_at is not null then trip was activated

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
		v.created_at < '2022-12-01'
--		and
--		vk.cluster_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
--		and 
--		vk.is_active = true 
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
			sum(case 
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
			b.created_at >= '2022-11-01'
			and 
			b.created_at < '2022-12-01'
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
;


--=============================================================================
-- 9) History chart of trips
--=============================================================================

select 
	to_char(b.created_at, 'YYYY-MM') as trip_month, 
	sum(b.trip_completed) as trip_completed
from
	bookings b
where 
--	b.cluster_head_user_id = '01FWZKXMMK0H49YT4BPVH539KG'
--	and 
	b.created_at >= date_trunc('month', now() - interval '5 month')
	and 
	b.created_at < date_trunc('month', now() + interval '1 month')
group by 
	to_char(b.created_at, 'YYYY-MM')
order by 
	trip_month
;

