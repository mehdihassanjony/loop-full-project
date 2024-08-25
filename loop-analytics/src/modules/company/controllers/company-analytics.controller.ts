import { Get, Query, Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { User, UserType } from 'src/common/decorators/user.decorator';
import { CompanyAnalyticsService } from '../services/company-analytics.service';
import { CompanyAnalyticsFilterDto } from '../dtos/company-analytics-filter.dto';
import { Result } from 'src/common/result';
import { ModuleName } from 'src/common/constants';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('company')
export class CompanyAnalyticsController {
  constructor(private companyAnalyticsService: CompanyAnalyticsService) {}

  @Permissions(ModuleName.Company, ['shipper', 'admin', 'gm', 'cluster_head'])
  @Get('/')
  async getBaseMetrics(
    @Query() filter: CompanyAnalyticsFilterDto,
    @User() user: UserType,
  ) {
    const result = await this.companyAnalyticsService.getBaseMetrics(
      filter,
      user,
    );
    return Result.successResult('Company base metrics received.', result);
  }
}
