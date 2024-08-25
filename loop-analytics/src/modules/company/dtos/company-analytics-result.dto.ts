import { TripCountsResultDto } from './trip-counts-result.dto';
import { AdditionalMetricsResultDto } from './additional-metrics-result.dto';
import { RouteUsedResultDto } from './route-used-result.dto';
import { RouteCostResultDto } from './route-cost-result.dto';

export class CompanyAnalyticsResultDto {
  tripCounts: TripCountsResultDto | null = null;
  additionalMetrics: AdditionalMetricsResultDto | null = null;
  routesUsed: RouteUsedResultDto[] = [];
  routesCost: RouteCostResultDto[] = [];
}
