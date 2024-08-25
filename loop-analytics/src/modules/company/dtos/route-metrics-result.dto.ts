export class RouteMetricsResultDto {
  fromDistrictName: string | null = null;
  toDistrictName: string | null = null;
  requestedCount: number | null = null;
  completedCount: number | null = null;
  avgRate: number | null = null;
  totalRate: number | null = null;
  totalDistance: number | null = null;
  minRate: number | null = null;
  maxRate: number | null = null;
}
