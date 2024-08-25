import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CompanyAnalyticsFilterDto {
  @IsNotEmpty()
  @IsDate()
  fromDate: Date;

  @IsNotEmpty()
  @IsDate()
  toDate: Date;

  @IsOptional()
  @IsNumber()
  companyId: number;
}
