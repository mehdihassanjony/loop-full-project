import { FeedBlendingDto } from '../../feed/dtos/feed-blending.dto';

export class AnnounceBookingCreateCommand {
  constructor(readonly body: FeedBlendingDto) {}
}
