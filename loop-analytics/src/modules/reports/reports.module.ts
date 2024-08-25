import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TokenService } from 'src/common/services/token.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [HttpModule],
  controllers: [ReportsController],
  providers: [ReportsService, TokenService],
  exports: [ReportsService],
})
export class ReportsModule {}
