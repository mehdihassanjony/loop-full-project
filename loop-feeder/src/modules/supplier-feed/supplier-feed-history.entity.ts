import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SupplierFeed } from './supplier-feed.entity';

export type SupplierFeedHistoryDocument = SupplierFeedHistory & Document;

@Schema({
  timestamps: false,
  collection: 'supplier_feed_histories',
})
export class SupplierFeedHistory extends SupplierFeed {
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

export const SupplierFeedHistorySchema =
  SchemaFactory.createForClass(SupplierFeedHistory);

SupplierFeedHistorySchema.index({ createdAt: 1 });
SupplierFeedHistorySchema.index({ updatedAt: 1 });
SupplierFeedHistorySchema.index({ userId: 1 }, { unique: false });
