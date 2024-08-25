import { FeedBlendingDto } from '../../feed/dtos/feed-blending.dto';

export class AnnounceSupplierFeedSyncCommand {
  constructor(readonly body: FeedBlendingDto) {}
}
