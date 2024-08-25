import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalApiService } from 'src/common/services/external-api.service';
import { TokenService } from 'src/common/services/token.service';
import { CompanyAnalyticsController } from './controllers/company-analytics.controller';
import { CompanyAnalyticsService } from './services/company-analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([]), HttpModule],
  controllers: [CompanyAnalyticsController],
  providers: [CompanyAnalyticsService, TokenService, ExternalApiService],
  exports: [CompanyAnalyticsService],
})
export class CompanyModule {}
