import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeedType } from 'src/modules/feed/dtos/feed-blending.dto';
import { ReturnFeedService } from 'src/modules/return-feed/return-feed.service';
import { FeedService } from '../../feed/feed.service';
import { BrokerService } from '../broker.service';
import { AnnounceBookingCreateCommand } from '../commands/announce-booking-create.command';

@CommandHandler(AnnounceBookingCreateCommand)
@Injectable()
export class AnnounceBookingCreateHandler
  implements ICommandHandler<AnnounceBookingCreateCommand>
{
  constructor(
    private brokerService: BrokerService,
    private feedService: FeedService,
    private returnFeedService: ReturnFeedService,
  ) {}

  async execute(command: AnnounceBookingCreateCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      // default feed initialize
      // command.body.feedType = FeedType.NORMAL_FEED;
      await this.feedService.blendingFeed(command.body);
      return true;
    } else {
      console.log('error');
      // handle error
    }
  }
}
