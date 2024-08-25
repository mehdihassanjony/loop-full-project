import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SupplierFeedService } from 'src/modules/supplier-feed/supplier-feed.service';
import { BrokerService } from '../broker.service';
import { AnnounceSupplierAddManuallyCommand } from '../commands/announce-supplier-add-manually.command';

@CommandHandler(AnnounceSupplierAddManuallyCommand)
@Injectable()
export class AnnounceSupplierAddManuallyHandler
  implements ICommandHandler<AnnounceSupplierAddManuallyCommand>
{
  constructor(
    private brokerService: BrokerService,
    private supFeedService: SupplierFeedService,
  ) {}

  async execute(command: AnnounceSupplierAddManuallyCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      return await this.supFeedService.updateSupplierManualFeedCount(
        command.body,
      );
    } else {
      console.log('error');
      // handle error
    }
  }
}
