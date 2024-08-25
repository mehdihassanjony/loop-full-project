import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SupplierUserType } from '../../common/decorators/user.decorator';
import { SupplierStatus } from './enums';

export type SupplierFeedDocument = SupplierFeed & Document;

@Schema({
  timestamps: true,
  collection: 'supplier_feeds',
})
export class SupplierFeed {
  @Prop({
    required: [true, 'userId is required'],
    type: String,
    unique: true,
  })
  userId: string;

  @Prop({
    required: false,
    type: Object,
    default: {},
  })
  user: SupplierUserType;

  @Prop({
    required: [true, 'marketPlaceFeedCount is required'],
    type: Number,
    default: 0,
  })
  marketPlaceFeedCount: number;

  @Prop({
    required: [true, 'assignedFeedCount is required'],
    type: Number,
    default: 0,
  })
  assignedFeedCount: number;

  @Prop({
    required: [true, 'assignedFeedCount is required'],
    type: Number,
    default: 0,
  })
  manualFeedCount: number;

  @Prop({
    required: [true, 'totalFeedCount is required'],
    type: Number,
    default: 0,
  })
  totalFeedCount: number;

  @Prop({
    required: [true, 'totalAmount is required'],
    type: Number,
    default: 0,
  })
  totalAmount: number;

  @Prop({
    required: [true, 'lastFeedAt is required'],
    type: Date,
    default: Date.now(),
  })
  lastFeedAt: Date;

  @Prop({
    required: [true, 'subsType is required'],
    type: String,
    default: '',
  })
  subsType: string;

  @Prop({
    required: [true, 'makePayout is required'],
    type: String,
    default: '',
  })
  makePayout: string;

  @Prop({
    required: [true, 'zone is required'],
    type: String,
    default: '',
  })
  zone: string;

  @Prop({
    required: [true, 'status is required'],
    type: String,
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE,
  })
  status: SupplierStatus;
}

export const SupplierFeedSchema = SchemaFactory.createForClass(SupplierFeed);

SupplierFeedSchema.index({ createdAt: 1 });
SupplierFeedSchema.index({ updatedAt: 1 });
SupplierFeedSchema.index({ userId: 1 });
