import { Injectable, Logger } from '@nestjs/common';
import {
  AmqpConnectionManager,
  ChannelWrapper,
  default as amqp,
} from 'amqp-connection-manager';
import { Connection, ConfirmChannel } from 'amqplib';
import { CommandBus } from '@nestjs/cqrs';
import { BrokerService, Consumer } from './broker.service.abstract';
import { Environment } from '../../common/enums';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RMQBrokerService extends BrokerService {
  connection: AmqpConnectionManager;
  retryDelay: number = 20;
  channel: ChannelWrapper;

  constructor(
    private commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {
    super();

    this.connection = amqp.connect(
      [this.configService.get('rabbitMqConfig').host],
      {
        reconnectTimeInSeconds: this.retryDelay,
        connectionOptions: { keepAlive: true },
      },
    );
    this.connection.on('connect', this.onConnection);
    this.connection.on('disconnect', this.onDisconnection.bind(this));
    this.channel = this.connection.createChannel({ json: true });
    // this.setupPublisher();
    // this.setupConsumer();
  }

  private setupPublisher() {
    this.channel = this.connection.createChannel({
      json: true,
      setup: (ch: ConfirmChannel) => {
        // =========== USER LAST ACTIVITY ROUTING KEY =========== //
        ch.assertExchange(Consumer.USER_EXCHANGE, 'topic', {
          durable: true,
        });

        ch.assertQueue(Consumer.USER_QUEUE, { durable: true });

        ch.bindQueue(
          Consumer.USER_QUEUE,
          Consumer.USER_EXCHANGE,
          Consumer.USER_LAST_ACTIVITY_EVENT_ROUTING_KEY,
        );

        // ============== USER LOGIN ROUTING KEY =============== //

        ch.bindQueue(
          Consumer.USER_QUEUE,
          Consumer.USER_EXCHANGE,
          Consumer.USER_LOGIN_EVENT_ROUTING_KEY,
        );
      },
    });
  }

  public async userLoginToUserQueue(body): Promise<boolean> {
    if (process.env.NODE_ENV === Environment.TEST) return true;

    return await this.channel.publish(
      Consumer.USER_EXCHANGE,
      Consumer.USER_LOGIN_EVENT_ROUTING_KEY,
      body,
      { persistent: true, contentType: 'application/json' },
    );
  }

  public async userLastActivityToUserQueue(body): Promise<boolean> {
    if (process.env.NODE_ENV === Environment.TEST) return true;

    return await this.channel.publish(
      Consumer.USER_EXCHANGE,
      Consumer.USER_LAST_ACTIVITY_EVENT_ROUTING_KEY,
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
