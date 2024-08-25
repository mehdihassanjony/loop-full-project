import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionFilter } from './common/filters';
import {
  ErrorLoggerInterceptor,
  RequestLoggerInterceptor,
  ResponseTransformInterceptor,
} from './common/interceptors';
import configuration from './config/configuration';
import { GlobalModule } from './global.module';
import { BrokerModule } from './modules/broker/broker.module';
import { FeedModule } from './modules/feed/feed.module';
import { SupplierFeedModule } from './modules/supplier-feed/supplier-feed.module';
import { ReturnFeedModule } from './modules/return-feed/return-feed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
    GlobalModule,
    FeedModule,
    SupplierFeedModule,
    BrokerModule,
    ReturnFeedModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorLoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
