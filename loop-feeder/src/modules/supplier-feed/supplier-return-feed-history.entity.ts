import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SupplierReturnFeed } from './supplier-return-feed.entity';

export type SupplierReturnFeedHistoryDocument = SupplierReturnFeedHistory &
  Document;

@Schema({
  timestamps: false,
  collection: 'supplier_return_feed_histories',
})
export class SupplierReturnFeedHistory extends SupplierReturnFeed {
  @Prop({
    required: [true, 'userId is required'],
    type: String,
    unique: false,
  })
  userId: string;

  @Prop({
    required: [true, 'createdAt is required'],
    type: Date,
  })
  createdAt: Date;

  @Prop({
    required: [true, 'createdAt is required'],
    type: Date,
  })
  updatedAt: Date;
}

export const SupplierReturnFeedHistorySchema = SchemaFactory.createForClass(
  SupplierReturnFeedHistory,
);

SupplierReturnFeedHistorySchema.index({ createdAt: 1 });
SupplierReturnFeedHistorySchema.index({ updatedAt: 1 });
SupplierReturnFeedHistorySchema.index({ userId: 1 }, { unique: false });
