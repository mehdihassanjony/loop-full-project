import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReturnFeedDocument = ReturnFeed & Document;

@Schema({
  timestamps: true,
  collection: 'return_feeds',
})
export class ReturnFeed {
  @Prop({
    required: [false, 'feedType is required'],
    type: String,
    default: 'return_feed',
  })
  feedType: string;

  @Prop({
    required: [true, 'userId is required'],
    type: String,
  })
  userId: string;

  @Prop({
    required: [true, 'bookingId is required'],
    type: Number,
  })
  bookingId: number;

  // @Prop({
  //   required: [true, 'subsType is required'],
  //   type: String,
  // })
  // subsType: string;

  // @Prop({
  //   required: [true, 'makePayout is required'],
  //   type: String,
  // })
  // makePayout: string;

  @Prop({
    required: [true, 'zone is required'],
    type: String,
  })
  zone: string;
}

export const ReturnFeedSchema = SchemaFactory.createForClass(ReturnFeed);

ReturnFeedSchema.index({ createdAt: 1, updatedAt: 1 });
ReturnFeedSchema.index({
  userId: 1,
  zone: 1,
  subsType: 1,
  feedType: 1,
  bookingId: 1,
});
ReturnFeedSchema.index({ userId: 1, bookingId: 1 }, { unique: true });
