import { config } from 'dotenv';
config();

import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import configuration from './config/index';
import { Environment } from './common/enums';
import * as morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan('tiny'));

  // ======================= INITIALIZE SENTRY ====================== //
  Sentry.init({
    dsn: configuration.sentryConfig.sentryDsn,
    environment: configuration.sentryConfig.sentryEnv,
  });

  // ======================== SET SENTRY TAG ======================= //
  Sentry.configureScope((scope) => {
    scope.setTag('service', 'auth');
  });

  // ====================== CROSS ORIGIN POLICY ===================== //
  app.enableCors({
    allowedHeaders: '',
    origin: '*', // This might need to be changed into some specific values, rather than all
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
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

  // ===================== SET ENDPOINT PREFIX ===================== //
  let endpointBasePrefix = '/lf-auth/api/v1/';

  if (process.env.NODE_ENV === Environment.PRODUCTION) {
    endpointBasePrefix = '/api/v1/';
  }

  app.setGlobalPrefix(endpointBasePrefix);

  // ====================== SET PORT NUMBER ======================= //
  const port = configuration.port || 3070;

  await app.listen(port);

  // ===================== LOG APP STARTING ====================== //
  Logger.log(
    `App with endpoint '${endpointBasePrefix}' running on port ${port}`,
    'AuthService',
  );
}

bootstrap();
