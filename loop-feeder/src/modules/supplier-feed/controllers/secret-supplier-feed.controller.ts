import { Controller, Get, UseGuards } from '@nestjs/common';
import { SecretKeyGuard } from 'src/common/guards/secret-key.guard';
import { SupplierFeedService } from '../supplier-feed.service';

@UseGuards(SecretKeyGuard)
@Controller('/secret/supplier-feed')
export class SecretSupplierFeedController {
  constructor(private suppFeedService: SupplierFeedService) {}

  @Get('/reset')
  async resetSupplierFeed() {
    await this.suppFeedService.resetSupplierFeed();
    return {
      message: 'Supplier feed reset successfully',
      data: {},
    };
  }
}
