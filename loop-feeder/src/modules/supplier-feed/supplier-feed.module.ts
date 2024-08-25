import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupplierService } from '../../common/services/supplier.service';
import {
  SupplierFeedHistory,
  SupplierFeedHistorySchema,
} from './supplier-feed-history.entity';
import { SupplierFeedController } from './controllers/supplier-feed.controller';
import { SupplierFeed, SupplierFeedSchema } from './supplier-feed.entity';
import { SupplierFeedService } from './supplier-feed.service';
import { SecretSupplierFeedController } from './controllers/secret-supplier-feed.controller';
import {
  SupplierReturnFeed,
  SupplierReturnFeedSchema,
} from './supplier-return-feed.entity';
import {
  SupplierReturnFeedHistory,
  SupplierReturnFeedHistorySchema,
} from './supplier-return-feed-history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupplierFeed.name, schema: SupplierFeedSchema },
      { name: SupplierFeedHistory.name, schema: SupplierFeedHistorySchema },
      { name: SupplierReturnFeed.name, schema: SupplierReturnFeedSchema },
      {
        name: SupplierReturnFeedHistory.name,
        schema: SupplierReturnFeedHistorySchema,
      },
    ]),
  ],
  controllers: [SupplierFeedController, SecretSupplierFeedController],
  providers: [SupplierFeedService, SupplierService],
  exports: [SupplierFeedService],
})
export class SupplierFeedModule {}
