import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class FilterSupplierFeedDto {
  @Transform(({ value }) => JSON.parse(value))
  @IsString({ each: true })
  @IsNotEmpty()
  ids: string[];
}
