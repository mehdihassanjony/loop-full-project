import databaseConfig from './database.config';

export default () => ({
  port: parseInt(process.env.PORT),
  rabbitmqUrl: process.env.RABBITMQ_URL,
  database: databaseConfig,
  userService: process.env.USER_SERVICE,
  authService: process.env.AUTH_SERVICE,
  companyService: process.env.COMPANY_SERVICE,
  locationService: process.env.LOCATION_SERVICE,
  supplierService: process.env.SUPPLIER_SERVICE,
  supAssService: process.env.SUP_ASS_SERVICE,
  bookingService: process.env.BOOKING_SERVICE,
  secretKey: process.env.SECRET_KEY,
  sentryDsn: process.env.SENTRY_DSN,
  sentryEnv: process.env.SENTRY_ENV,
  nodeEnv: process.env.NODE_ENV,
});
