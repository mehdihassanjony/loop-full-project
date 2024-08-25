export enum Consumer {
  USER_QUEUE = 'user.events.queue',
  USER_EXCHANGE = 'user.events.exchange',

  USER_LOGIN_EVENT_ROUTING_KEY = 'user.events.user.login',
  USER_LAST_ACTIVITY_EVENT_ROUTING_KEY = 'user.events.user.lastActivity',
}

export abstract class BrokerService {
  public abstract isConnected(): boolean;

  public abstract userLoginToUserQueue(body): Promise<boolean>;

  public abstract userLastActivityToUserQueue(body): Promise<boolean>;
}
