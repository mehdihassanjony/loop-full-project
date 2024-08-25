import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class HistoryChartQueryDto {
  @IsOptional()
  @IsString()
  chUserId: string = null;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: Date }) => {
    value.setHours(6);
    value.setDate(1);
    return value;
  })
  date: Date;
}
