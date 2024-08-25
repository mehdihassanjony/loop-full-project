import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BookingService } from 'src/common/services/booking.service';
import { FeedBlendingDto, FeedType } from '../feed/dtos/feed-blending.dto';
import { SupplierFeedService } from '../supplier-feed/supplier-feed.service';
import { ReturnFeed, ReturnFeedDocument } from './return-feed.entity';

@Injectable()
export class ReturnFeedService {
  constructor(
    @InjectModel(ReturnFeed.name)
    private rfModel: Model<ReturnFeedDocument>,
    private supService: SupplierFeedService,
    private bookingService: BookingService,
  ) {}

  public async blendingReturnFeed(body: FeedBlendingDto): Promise<string[]> {
    Logger.log(JSON.stringify(body, null, 3), 'BlendingReturnFeed');
    const suppliers = await this.bookingService.getReturnSuppliersByZone(
      body.zone,
      body.truckCategory.nameEn,
    );
    Logger.log(JSON.stringify(suppliers, null, 3), 'ReturnFeedSuppliers');
    if (!suppliers.length) return [];
    body.suppliers = suppliers.map((sup) => sup.userId);
    body.suppliersWithFeedType = suppliers.map((sup) => ({
      feedType: FeedType.RETURN_FEED,
      userId: sup.userId,
    }));
    this.publishedAndStoreSupplierReturnFeed(body);
    return body.suppliers;
  }

  private async publishedAndStoreSupplierReturnFeed(body: FeedBlendingDto) {
    const newFeed: ReturnFeed[] = [];
    for (const supId of body.suppliers) {
      newFeed.push({
        userId: supId,
        bookingId: body.bookingId,
        feedType: FeedType.RETURN_FEED,
        zone: body.zone,
      });
    }
    await this.supService.updateReturnSupplierInfo(body.suppliers);
    this.rfModel.insertMany(newFeed);
    return true;
  }
}
