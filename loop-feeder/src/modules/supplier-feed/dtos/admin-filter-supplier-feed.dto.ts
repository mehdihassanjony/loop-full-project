import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Pagination } from '../../../common/pagination';
import { SubsType } from '../enums';

export class AdminFilterSupplierFeedDto extends Pagination {
  @IsOptional()
  @IsString()
  zone: string;

  @IsEnum(SubsType, { message: 'Invalid subscription type' })
  @IsOptional()
  @IsString()
  subsType: SubsType;

  @IsOptional()
  @IsString()
  query: string;
}
