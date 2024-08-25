import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Consumer } from './consumer';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { Connection, ConsumeMessage } from 'amqplib';
import { FeedBlendingDto } from '../feed/dtos/feed-blending.dto';
import { AnnounceBookingCreateCommand } from './commands/announce-booking-create.command';
import {
  AnnounceSupplierAddManuallyCommand,
  ISupplierAddManuallyEventDto,
} from './commands/announce-supplier-add-manually.command';
import {
  AnnounceTripStatusUpdateCommand,
  ITripStatusUpdateEventDto,
} from './commands/announce-trip-status-update.command';
import {
  AnnounceSupplierStoreCommand,
  ISupplierStoreEventDto,
} from './commands/announce-supplier-store.command';

@Injectable()
export class BrokerService {
  private connection: AmqpConnectionManager;
  private retryDelay: number = 20;
  private channel: ChannelWrapper;

  constructor(private config: ConfigService, private commandBus: CommandBus) {
    this.connection = amqp.connect([this.config.get('rabbitmqUrl')], {
      reconnectTimeInSeconds: this.retryDelay,
      connectionOptions: { keepAlive: true },
    });
    this.connection.on('connect', this.onConnection);
    this.connection.on('disconnect', this.onDisconnection.bind(this));
    this.channel = this.connection.createChannel({ json: true });
    this.consumeMessages();
  }

  private consumeMessages() {
    const ch = this.channel;
    ch.consume(Consumer.FEED_QUEUE, (msg: ConsumeMessage) => {
      const { fields, content, properties } = msg;
      if (fields.routingKey === Consumer.BOOKING_CREATE_ROUTING_KEY) {
        const body: FeedBlendingDto = JSON.parse(content.toString());
        this.commandBus
          .execute(new AnnounceBookingCreateCommand(body))
          .then((res) => {
            if (res) ch.ack(msg);
          })
          .catch((err) => {
            // ch.nack(msg);
            Logger.error(JSON.stringify(err), 'BookingCreateEvent');
          });
      } else if (
        fields.routingKey === Consumer.MANUALLY_ADD_SUPPLIER_ROUTING_KEY
      ) {
        const body: ISupplierAddManuallyEventDto = JSON.parse(
          content.toString(),
        );
        this.commandBus
          .execute(new AnnounceSupplierAddManuallyCommand(body))
          .then((res) => {
            if (res) ch.ack(msg);
          });
      } else if (
        fields.routingKey === Consumer.TRIP_STATUS_UPDATE_ROUTING_KEY
      ) {
        const body: ITripStatusUpdateEventDto = JSON.parse(content.toString());
        this.commandBus
          .execute(new AnnounceTripStatusUpdateCommand(body))
          .then((res) => {
            if (res) ch.ack(msg);
          });
      } else if (
        // fields.routingKey === Consumer.SUPPLIER_CREATE_ROUTING_KEY ||
        fields.routingKey === Consumer.SUPPLIER_UPDATE_ROUTING_KEY
      ) {
        let body = JSON.parse(content.toString());
        if (body.hasOwnProperty('body')) body = body.body;
        else body['userId'] = body['supplierId'];
        this.commandBus
          .execute(
            new AnnounceSupplierStoreCommand(body as ISupplierStoreEventDto),
          )
          .then((res) => {
            if (res) ch.ack(msg);
          })
          .catch((err) => {});
      } else {
        console.log('No routing key found', fields);
        console.log('content', content.toString());
        ch.ack(msg);
      }
    });
  }

  public async publishSupplierFeed(body: FeedBlendingDto) {
    return await this.channel.publish(
      Consumer.FEED_EXCHANGE,
      Consumer.SUPPLIER_FEED_SYNC_ROUTING_KEY,
      body,
      { persistent: true, contentType: 'application/json' },
    );
  }

  public isConnected(): boolean {
    return this.connection.isConnected();
  }
  private onConnection(connection: Connection, connection_url: string) {
    Logger.log(`Rabbitmq connection established!`, 'RMQBrokerService');
  }
  private onDisconnection(error) {
    Logger.error('Rabbitmq disconnected!', 'RMQBrokerService');
    Logger.log(
      `Retrying connection in ${this.retryDelay} second(s)`,
      'RMQBrokerService',
    );
  }
}
