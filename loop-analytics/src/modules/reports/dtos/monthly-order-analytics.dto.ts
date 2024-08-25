import { IsNotEmpty, IsString } from 'class-validator';

export class MonthlyOrderAnalyticsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
