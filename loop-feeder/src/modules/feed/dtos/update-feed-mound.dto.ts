import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedMouldDto } from './create-feed-mould.dto';

export class UpdateFeedMouldDto extends PartialType(CreateFeedMouldDto) {
  @IsString()
  @IsNotEmpty()
  clusterZone: string;

  // @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  monthlyTarget: number;

  // @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  totalBronzeSupplier: number;

  // @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  totalSilverSupplier: number;

  // @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  totalGoldSupplier: number;

  // @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  totalDiamondSupplier: number;
}
