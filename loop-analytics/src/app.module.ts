import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionFilter } from './common/filters';
import {
  ErrorLoggerInterceptor,
  RequestLoggerInterceptor,
} from './common/interceptors';
import configuration from './config/configuration';
import { CompanyModule } from './modules/company/company.module';
import { ProReportModule } from './modules/pro-report/pro-report.module';
import { ReportsService } from './modules/reports/reports.service';
import { ReportsModule } from './modules/reports/reports.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { DEFAULT_DATABASE, MB_DATABASE } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: DEFAULT_DATABASE,
      useFactory: async (config: ConfigService) =>
        config.get(`database.${DEFAULT_DATABASE}`),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: MB_DATABASE,
      useFactory: async (config: ConfigService) =>
        config.get(`database.${MB_DATABASE}`),
    }),
    CompanyModule,
    ProReportModule,
    ReportsModule,
    MetricsModule,
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
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    AppService,
    ReportsService,
  ],
})
export class AppModule {}
