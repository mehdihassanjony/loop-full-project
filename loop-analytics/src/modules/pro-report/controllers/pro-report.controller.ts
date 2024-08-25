import { Get, Query, Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { ProReportService } from '../services/pro-report.service';
import { ProReportFilterDto } from '../dtos/pro-report-filter.dto';
import { Result } from 'src/common/result';
import { ModuleName } from 'src/common/constants';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('pro-report')
export class ProReportController {
  constructor(private proReportService: ProReportService) {}

  @Permissions(ModuleName.ProReport, ['admin', 'gm', 'cluster_head'])
  @Get('/')
  async getBaseMetrics(@Query() filter: ProReportFilterDto) {
    const result = await this.proReportService.getBaseMetrics(filter);
    return Result.successResult('Pro-report base metrics received.', result);
  }
}
