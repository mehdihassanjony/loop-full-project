import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedDocument = Feed & Document;

@Schema({
  timestamps: true,
})
export class Feed {
  @Prop({
    required: [true, 'feedType is required'],
    type: String,
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
  //   required: [true, 'fullName is required'],
  //   type: String,
  // })
  // fullName: string;

  @Prop({
    required: [true, 'subsType is required'],
    type: String,
  })
  subsType: string;

  @Prop({
    required: [true, 'makePayout is required'],
    type: String,
  })
  makePayout: string;

  @Prop({
    required: [true, 'zone is required'],
    type: String,
  })
  zone: string;

  @Prop({
    required: [false, 'reason is required'],
    type: String,
  })
  reason: string;
}

export const FeedSchema = SchemaFactory.createForClass(Feed);

FeedSchema.index({ createdAt: 1, updatedAt: 1 });
FeedSchema.index({
  userId: 1,
  zone: 1,
  subsType: 1,
  feedType: 1,
  bookingId: 1,
});
FeedSchema.index({ userId: 1, bookingId: 1 }, { unique: true });
