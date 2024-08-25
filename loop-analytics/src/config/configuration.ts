import databaseConfig from './database.config';

export default () => ({
  port: parseInt(process.env.PORT),
  database: databaseConfig,
  authService: process.env.AUTH_SERVICE,
  userService: process.env.USER_SERVICE,
  companyService: process.env.COMPANY_SERVICE,
  secretKey: process.env.SECRET_KEY,
  sentryDsn: process.env.SENTRY_DSN,
  sentryEnv: process.env.SENTRY_ENV,
  nodeEnv: process.env.NODE_ENV,
});
