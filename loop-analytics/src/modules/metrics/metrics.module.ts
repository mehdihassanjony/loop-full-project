import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExternalApiService } from 'src/common/services/external-api.service';
import { TokenService } from 'src/common/services/token.service';
import { OperationaMetricsController } from './controllers/metrics.controller';
import { MetricsService } from './services/metrics.service';

@Module({
  imports: [HttpModule],
  controllers: [OperationaMetricsController],
  providers: [MetricsService, TokenService, ExternalApiService],
})
export class MetricsModule {}
