import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './config/configuration';
import * as Sentry from '@sentry/node';
import { Environment } from './common/enums';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = configuration.call(this);
  // configure sentry with the DSN name
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnv,
  });
  // differentiate error with the given name (name can be the microservice name)
  Sentry.configureScope((scope) => {
    scope.setTag('service', 'analytics');
  });

  // Enabling cross-origin resource sharing that is another domain can request resources
  app.enableCors({
    origin: '*', // This might need to be changed into some specific values, rather than all
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Pipeline for validation of all inputs.
  // It will be transformed, and if implicit transformation can be done transform immediately.
  // The input data, which do not contain any validation decorator, of a validated object.
  // Exceptions are handled using exceptionFactory parameter
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        if (validationErrors[0].children.length)
          return new BadRequestException(
            Object.values(validationErrors[0].children[0].constraints)[0],
          );
        else
          return new BadRequestException(
            Object.values(validationErrors[0].constraints)[0],
          );
      },
    }),
  );
  let appVersion = 'lf-analytics/api/v1/';
  if (process.env.NODE_ENV === Environment.PRODUCTION) appVersion = '/api/v1/';
  app.setGlobalPrefix(appVersion);
  // Setting port number
  const port = config.port || 3040;
  // Start listening to the port, that is the page can be accessed with the given port
  await app.listen(port);
  Logger.log('App running on port ' + appVersion + ' ' + port, 'AnalyticsService');
}
bootstrap();
