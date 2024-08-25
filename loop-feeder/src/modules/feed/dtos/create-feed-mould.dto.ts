import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFeedMouldDto {
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
