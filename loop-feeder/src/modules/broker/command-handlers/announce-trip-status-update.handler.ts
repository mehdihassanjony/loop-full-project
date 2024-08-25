import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SupplierFeedService } from 'src/modules/supplier-feed/supplier-feed.service';
import { BrokerService } from '../broker.service';
import { AnnounceTripStatusUpdateCommand } from '../commands/announce-trip-status-update.command';

@CommandHandler(AnnounceTripStatusUpdateCommand)
@Injectable()
export class AnnounceTripStatusUpdateHandler
  implements ICommandHandler<AnnounceTripStatusUpdateCommand>
{
  constructor(
    private brokerService: BrokerService,
    private supFeedService: SupplierFeedService,
  ) {}

  async execute(command: AnnounceTripStatusUpdateCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      const isPublished = await this.supFeedService.updateSupplierAmount(
        command.body,
      );
      return isPublished;
    } else {
      console.log('error');
      // handle error
    }
  }
}
