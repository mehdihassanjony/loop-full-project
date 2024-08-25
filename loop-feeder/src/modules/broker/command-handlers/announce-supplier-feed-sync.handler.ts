import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerService } from '../broker.service';
import { AnnounceSupplierFeedSyncCommand } from '../commands/announce-supplier-feed-sync.command';

@CommandHandler(AnnounceSupplierFeedSyncCommand)
@Injectable()
export class AnnounceSupplierFeedSyncHandler
  implements ICommandHandler<AnnounceSupplierFeedSyncCommand>
{
  constructor(private readonly brokerService: BrokerService) {}

  async execute(command: AnnounceSupplierFeedSyncCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      const isPublished = await this.brokerService.publishSupplierFeed(
        command.body,
      );
      console.log(
        'booking supplier event published',
        isPublished,
        command.body,
      );
      return isPublished;
    } else {
      console.log('error');
      // handle error
    }
  }
}
