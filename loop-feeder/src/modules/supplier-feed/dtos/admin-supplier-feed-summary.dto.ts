import { IsDate, IsOptional, IsString } from 'class-validator';
import { Pagination } from '../../../common/pagination';

export class AdminSupplierFeedSummaryDto extends Pagination {
  @IsOptional()
  @IsString()
  zone: string;

  @IsOptional()
  @IsDate()
  startDate: Date;
}
