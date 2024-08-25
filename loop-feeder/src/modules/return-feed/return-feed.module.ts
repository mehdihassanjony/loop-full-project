import { Module } from '@nestjs/common';
import { ReturnFeedService } from './return-feed.service';
import { ReturnFeedController } from './return-feed.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReturnFeed, ReturnFeedSchema } from './return-feed.entity';
import { BookingService } from 'src/common/services/booking.service';
import { SupplierFeedModule } from '../supplier-feed/supplier-feed.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReturnFeed.name, schema: ReturnFeedSchema },
    ]),
    SupplierFeedModule,
  ],
  controllers: [ReturnFeedController],
  providers: [ReturnFeedService, BookingService],
  exports: [ReturnFeedService],
})
export class ReturnFeedModule {}
