import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionFilter } from './common/filters';
import {
  ErrorLoggerInterceptor,
  RequestLoggerInterceptor,
} from './common/interceptors';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { RedisCacheModule } from './modules/redis/redis.module';
import configuration from './config';
import { BrokerModule } from './modules/broker/broker.module';
import { GlobalModule } from './global.module';

let APP_PROVIDERS = [
  {
    provide: APP_FILTER,
    useClass: AllExceptionFilter,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: RequestLoggerInterceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ErrorLoggerInterceptor,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => configuration],
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        ...config.get('databaseConfig'),
        retryDelay: 3000,
      }),
    }),
    RedisCacheModule,
    GlobalModule,
    AuthModule,
    BrokerModule,
  ],
  controllers: [AppController],
  providers: APP_PROVIDERS,
})
export class AppModule {}
