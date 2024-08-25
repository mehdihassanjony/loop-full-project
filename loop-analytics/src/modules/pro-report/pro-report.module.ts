import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from 'src/common/services/token.service';
import { ProReportController } from './controllers/pro-report.controller';
import { ProReportService } from './services/pro-report.service';

@Module({
  imports: [TypeOrmModule.forFeature([]), HttpModule],
  controllers: [ProReportController],
  providers: [ProReportService, TokenService],
  exports: [ProReportService],
})
export class ProReportModule {}
