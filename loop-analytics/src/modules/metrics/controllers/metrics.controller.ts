import { Get, Query, Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { User, UserRole, UserType } from 'src/common/decorators/user.decorator';
import { Result } from 'src/common/result';
import { MetricsService } from '../services/metrics.service';
import { TopShipperQueryDto } from '../dtos/top-shippers-query.dto';
import { TopVendorQueryDto } from '../dtos/top-vendor-query.dto';
import { ModuleName } from 'src/common/constants';
import { SummaryQueryDto } from '../dtos/summary-query.dto';
import { HistoryChartQueryDto } from '../dtos/history-chart-query.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('operational-metrics')
export class OperationaMetricsController {
  constructor(private metricsService: MetricsService) {}

  @Permissions(ModuleName.Metrics, [
    UserRole.ADMIN,
    UserRole.GM,
    UserRole.CLUSTER_HEAD,
  ])
  @Get('summary')
  async getSummary(@User() user: UserType, @Query() query: SummaryQueryDto) {
    const result = await this.metricsService.getSummary(user, query);
    return Result.successResult('Summary received.', result);
  }

  @Permissions(ModuleName.Metrics, [
    UserRole.ADMIN,
    UserRole.GM,
    UserRole.CLUSTER_HEAD,
  ])
  @Get('top-shippers')
  async getTopShippers(
    @User() user: UserType,
    @Query() query: TopShipperQueryDto,
  ) {
    const result = await this.metricsService.getTopShippers(user, query);
    return Result.successResult('Top Shippers By Rank received.', result);
  }

  @Permissions(ModuleName.Metrics, [
    UserRole.ADMIN,
    UserRole.GM,
    UserRole.CLUSTER_HEAD,
  ])
  @Get('top-vendors')
  async getTopVendors(
    @User() user: UserType,
    @Query() query: TopVendorQueryDto,
  ) {
    const result = await this.metricsService.getTopVendors(user, query);
    return Result.successResult('Top Vendors By Rank received.', result);
  }

  @Permissions(ModuleName.Metrics, [
    UserRole.ADMIN,
    UserRole.GM,
    UserRole.CLUSTER_HEAD,
  ])
  @Get('history-chart')
  async getHistoryChart(
    @User() user: UserType,
    @Query() query: HistoryChartQueryDto,
  ) {
    const result = await this.metricsService.getHistoryChart(user, query);
    return Result.successResult('History chart received.', result);
  }
}
