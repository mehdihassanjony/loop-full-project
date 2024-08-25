import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerService } from '../broker.service.abstract';
import { AnnounceUserLoginCommand } from '../commands/announce-user-login.command';

@CommandHandler(AnnounceUserLoginCommand)
@Injectable()
export class AnnounceUserLoginHandler
  implements ICommandHandler<AnnounceUserLoginCommand>
{
  constructor(private readonly brokerService: BrokerService) {}

  async execute(command: AnnounceUserLoginCommand): Promise<boolean> {
    if (this.brokerService.isConnected()) {
      const isPublished = await this.brokerService.userLoginToUserQueue(
        command,
      );

      return isPublished;
    } else {
      console.log('error');
      // handle error
    }
  }
}
