import { IsNotEmpty, IsString } from 'class-validator';
import { Pagination } from 'src/common/pagination';

interface FeedType {
  assignedFeedCount: 'assignedFeedCount';
  marketPlaceFeedCount: 'marketPlaceFeedCount';
}

export class CreateSupplierFeedDto extends Pagination {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  feedType: FeedType;

  //   @IsNumber()
  //   @IsOptional()
  //   marketPlaceFeedCount: number;

  //   @IsNumber()
  //   @IsOptional()
  //   assignedFeedCount: boolean;
}
