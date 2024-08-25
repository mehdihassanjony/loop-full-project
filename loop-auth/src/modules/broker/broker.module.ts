import { Module } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BrokerService } from './broker.service.abstract';
import { RMQBrokerService } from './broker.service.rmq';
import { AnnounceUserLastActivityHandler } from './command-handlers/announce-user-lastactivity.handler';
import { AnnounceUserLoginHandler } from './command-handlers/announce-user-login.handler';

@Module({
  imports: [],
  providers: [
    {
      provide: BrokerService,
      useClass: RMQBrokerService,
    },
    AnnounceUserLastActivityHandler,
    AnnounceUserLoginHandler,
  ],
  exports: [BrokerService],
})
export class BrokerModule {}
