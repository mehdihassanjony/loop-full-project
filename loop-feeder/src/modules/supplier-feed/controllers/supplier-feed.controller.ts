import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AdminFilterSupplierFeedDto } from '../dtos/admin-filter-supplier-feed.dto';
import { AdminSupplierFeedSummaryDto } from '../dtos/admin-supplier-feed-summary.dto';
import { FilterSupplierFeedDto } from '../dtos/filter-supplier-feed.dto';
import { SupplierFeedService } from '../supplier-feed.service';

@Controller('supplier-feed')
export class SupplierFeedController {
  constructor(private suppFeedService: SupplierFeedService) {}

  @Post('/')
  async storeSupplier() {
    const data = await this.suppFeedService.storeSupplier([]);
    return {
      message: 'OK',
      data: data,
    };
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('feed', ['admin', 'gm', 'cluster_head'])
  @Get('/')
  async getSupplierFeed(@Query() q: AdminFilterSupplierFeedDto) {
    const { data, count } = await this.suppFeedService.getSupplierFeed(q);
    return {
      message: 'Supplier analytics data get successfully',
      count: count,
      data: data,
    };
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('feed', ['admin', 'gm', 'cluster_head'])
  @Get('/summary')
  async supplierFeedSummary(@Query() q: AdminSupplierFeedSummaryDto) {
    const summary = await this.suppFeedService.supplierFeedSummary(q);
    return {
      message: 'Supplier feed summary get successfully',
      data: summary,
    };
  }

  @Get('/subs-cache')
  public async suppliersByGroup(@Query() filter: FilterSupplierFeedDto) {
    const data = await this.suppFeedService.getDefaultSupplier(filter.ids);
    return {
      message: 'Supplier group data get successfully.',
      data: data,
    };
  }

  @Get('/subs')
  public async suppliersCache(@Query() filter: FilterSupplierFeedDto) {
    const data = await this.suppFeedService.getDefaultSupplier(filter.ids);
    return {
      message: 'Supplier group data get successfully.',
      data: data,
    };
  }

  @Get('/group')
  async findSupplierByGroup() {
    const data = await this.suppFeedService.allSupplierGroups();
    return {
      message: 'OK',
      data: data,
    };
  }
}
