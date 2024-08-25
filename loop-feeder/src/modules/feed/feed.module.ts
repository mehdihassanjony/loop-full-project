import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Feed, FeedSchema } from './feed.entity';
import { FeedMould, FeedMouldSchema } from './feed-mould.entity';
import { SupplierFeedModule } from '../supplier-feed/supplier-feed.module';
import { SupplierService } from '../../common/services/supplier.service';
import { ReturnFeedModule } from '../return-feed/return-feed.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeedMould.name, schema: FeedMouldSchema },
      { name: Feed.name, schema: FeedSchema },
    ]),
    SupplierFeedModule,
    ReturnFeedModule,
  ],
  providers: [FeedService, SupplierService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
