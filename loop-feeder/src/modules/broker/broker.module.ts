import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { FeedModule } from '../feed/feed.module';
import { ReturnFeedModule } from '../return-feed/return-feed.module';
import { SupplierFeedModule } from '../supplier-feed/supplier-feed.module';
import { BrokerService } from './broker.service';
import { AnnounceBookingCreateHandler } from './command-handlers/announce-booking-create.handler';
import { AnnounceSupplierAddManuallyHandler } from './command-handlers/announce-supplier-add-manually.handler';
import { AnnounceSupplierFeedSyncHandler } from './command-handlers/announce-supplier-feed-sync.handler';
import { AnnounceSupplierStoreHandler } from './command-handlers/announce-supplier-store.handler';
import { AnnounceTripStatusUpdateHandler } from './command-handlers/announce-trip-status-update.handler';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    FeedModule,
    ReturnFeedModule,
    SupplierFeedModule,
  ],
  providers: [
    BrokerService,
    AnnounceSupplierFeedSyncHandler,
    AnnounceBookingCreateHandler,
    AnnounceSupplierAddManuallyHandler,
    AnnounceTripStatusUpdateHandler,
    AnnounceSupplierStoreHandler,
  ],
  exports: [BrokerService],
})
export class BrokerModule {}
