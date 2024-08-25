import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class TopVendorQueryDto {
  @IsOptional()
  @IsString()
  chUserId: string;

  @IsOptional()
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @IsNumber()
  count: number = 10;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: Date }) => {
    value.setHours(6);
    value.setDate(1);

    return value;
  })
  date: Date;
}
