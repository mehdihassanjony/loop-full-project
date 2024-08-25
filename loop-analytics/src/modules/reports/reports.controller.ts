import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Result } from 'src/common/result';
import { MonthlyOrderAnalyticsDto } from './dtos/monthly-order-analytics.dto';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private repService: ReportsService) {}

  @Get('/chmt')
  @Permissions('AnalyticsReport', ['admin', 'gm', 'cluster_head'])
  async chTripReportMonthly() {
    const report = await this.repService.chTripReportMonthly();
    return Result.successResult('Trip report get successfully.', report);
  }

  @Get('/chma')
  @Permissions('AnalyticsReport', ['admin', 'gm', 'cluster_head'])
  async chMonthlyOrderAnalytics(@Query() q: MonthlyOrderAnalyticsDto) {
    const report = await this.repService.chMonthlyOrderAnalytics(q);
    return Result.successResult(
      'Trip monthly analytics get successfully.',
      report,
    );
  }

  @Get('/chdt')
  @Permissions('AnalyticsReport', ['admin', 'gm', 'cluster_head'])
  async chTripReportDaily() {
    const report = await this.repService.chTripReportDaily();
    return Result.successResult('Trip report get successfully.', report);
  }
}
