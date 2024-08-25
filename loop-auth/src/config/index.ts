import redisConfig from './redis.config';
import secretConfig from './secret.config';
import sentryConfig from './sentry.config';
import databaseConfig from './database.config';
import rabbitMqConfig from './rabbitmq.config';

export default {
  port: process.env.PORT,
  userService: process.env.USER_SERVICE,
  companyService: process.env.COMPANY_SERVICE,
  jwtSecret: process.env.JWT_SECRET,
  redis: redisConfig,
  rabbitMqConfig: rabbitMqConfig,
  secretConfig: secretConfig,
  sentryConfig: sentryConfig,
  databaseConfig: databaseConfig,
};
