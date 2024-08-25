import { ProReportActionCountsResultDto } from './pro-report-action-counts-result.dto';
import { ProReportTripCountsResultDto } from './pro-report-trip-counts-result.dto';

export class ProReportResultDto {
  tripCounts: ProReportTripCountsResultDto | null = null;
  actionCounts: ProReportActionCountsResultDto | null = null;
}
