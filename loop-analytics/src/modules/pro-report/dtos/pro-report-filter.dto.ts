import {
  IsDate,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class ProReportFilterDto {
  @IsDate()
  @IsNotEmpty()
  fromDate: Date;

  @IsDate()
  @IsNotEmpty()
  toDate: Date;

  @IsString()
  proUserId: string;
}
