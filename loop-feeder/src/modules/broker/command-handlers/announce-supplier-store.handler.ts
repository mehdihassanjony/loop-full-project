import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SupplierFeedService } from 'src/modules/supplier-feed/supplier-feed.service';
import { BrokerService } from '../broker.service';
import { AnnounceSupplierStoreCommand } from '../commands/announce-supplier-store.command';

@CommandHandler(AnnounceSupplierStoreCommand)
@Injectable()
export class AnnounceSupplierStoreHandler
  implements ICommandHandler<AnnounceSupplierStoreCommand>
{
  constructor(
    private brokerService: BrokerService,
    private supFeedService: SupplierFeedService,
  ) {}

  async execute(command: AnnounceSupplierStoreCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      Logger.log(JSON.stringify(command.body, null, 3), 'SupplierStoreEvents');
      // setTimeout(async () => {
      await this.supFeedService.storeSupplier([command.body.userId]);
      // }, 5000);
      return true;
    } else {
      console.log('error');
      // handle error
    }
  }
}
