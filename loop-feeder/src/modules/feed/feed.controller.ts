import { Body, Controller, Param, Post, Put, Query } from '@nestjs/common';
import { CreateFeedMouldDto } from './dtos/create-feed-mould.dto';
import { FeedBlendingDto } from './dtos/feed-blending.dto';
import { UpdateFeedMouldDto } from './dtos/update-feed-mound.dto';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Post('/')
  public async blendingFeed(@Body() body: FeedBlendingDto) {
    const data = await this.feedService.blendingFeed(body);
    return {
      message: 'Feed generated successfully',
      data: data,
    };
  }

  @Post('/mould')
  public async storeFeedMound(@Body() body: CreateFeedMouldDto) {
    const data = await this.feedService.storeFeedMound(body);
    return {
      message: 'Feed mould calculated successfully',
      data: data,
    };
  }

  @Put('/mould/:zone')
  public async updateFeedMound(
    @Param('zone') zone: string,
    @Body() body: UpdateFeedMouldDto,
  ) {
    const data = await this.feedService.updateFeedMound(zone, body);
    return {
      message: 'Feed mould updated successfully',
      data: data,
    };
  }
}
