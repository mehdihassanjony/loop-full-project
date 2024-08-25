import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerService } from '../broker.service.abstract';
import { AnnounceUserLastActivityCommand } from '../commands/announce-user-last-activity.command';

@CommandHandler(AnnounceUserLastActivityCommand)
@Injectable()
export class AnnounceUserLastActivityHandler
  implements ICommandHandler<AnnounceUserLastActivityCommand>
{
  constructor(private readonly brokerService: BrokerService) {}

  async execute(command: AnnounceUserLastActivityCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      const isPublished = await this.brokerService.userLastActivityToUserQueue(
        command,
      );

      return isPublished;
    } else {
      console.log('error');
      // handle error
    }
  }
}
