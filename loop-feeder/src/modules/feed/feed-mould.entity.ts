import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedMouldDocument = FeedMould & Document;

@Schema({
  timestamps: true,
  collection: 'feed_moulds',
})
export class FeedMould {
  @Prop({
    required: [true, 'clusterZone is required'],
    trim: true,
    type: String,
    lowercase: true,
    unique: true,
  })
  clusterZone: string;

  @Prop({
    required: [true, 'monthlyTarget is required'],
    type: Number,
    default: 0,
  })
  monthlyTarget: number;

  @Prop({
    required: [true, 'dailyTarget is required'],
    type: Number,
    default: 0,
  })
  dailyTarget: number;

  @Prop({
    required: [true, 'vendorRatio is required'],
    type: Number,
    default: 3,
  })
  supplierRatio: number;

  @Prop({
    required: [true, 'monthlyFeed is required'],
    type: Number,
    default: 0,
  })
  monthlyFeed: number;

  @Prop({
    required: [true, 'dailyFeed is required'],
    type: Number,
    default: 0,
  })
  dailyFeed: number;

  // total supplier count
  @Prop({
    required: [true, 'totalBronzeSupplier is required'],
    type: Number,
    default: 0,
  })
  totalBronzeSupplier: number;

  @Prop({
    required: [true, 'totalSilverSupplier is required'],
    type: Number,
    default: 0,
  })
  totalSilverSupplier: number;

  @Prop({
    required: [true, 'bronzeFeedRatio is required'],
    type: Number,
    default: 0,
  })
  totalGoldSupplier: number;

  @Prop({
    required: [true, 'bronzeFeedRatio is required'],
    type: Number,
    default: 0,
  })
  totalDiamondSupplier: number;

  @Prop({
    required: [true, 'lowestSupplierCount is required'],
    type: Number,
    default: 0,
  })
  lowestSupplierCount: number;

  // supplier ratio by calc lowestSupplierCount
  @Prop({
    required: [true, 'bronzeFeedRatio is required'],
    type: Number,
    default: 1,
  })
  bronzeFeedRatio: number;

  @Prop({
    required: [true, 'bronzeFeedRatio is required'],
    type: Number,
    default: 2,
  })
  silverFeedRatio: number;

  @Prop({
    required: [true, 'goldFeedRatio is required'],
    type: Number,
    default: 3,
  })
  goldFeedRatio: number;

  @Prop({
    required: [true, 'DiamondFeedRatio is required'],
    type: Number,
    default: 4,
  })
  diamondFeedRatio: number;

  // supplier ratio
  @Prop({
    required: [true, 'bronzeSupplierRatio is required'],
    type: Number,
    default: 0,
  })
  bronzeSupplierRatio: number;

  @Prop({
    required: [true, 'adjustedBronzeFeedRatio is required'],
    type: Number,
    default: 0,
  })
  adjustedBronzeFeedRatio: number;

  @Prop({
    required: [true, 'silverSupplierRatio is required'],
    type: Number,
    default: 0,
  })
  silverSupplierRatio: number;

  @Prop({
    required: [true, 'adjustedSilverFeedRatio is required'],
    type: Number,
    default: 0,
  })
  adjustedSilverFeedRatio: number;

  @Prop({
    required: [true, 'goldSupplierRatio is required'],
    type: Number,
    default: 0,
  })
  goldSupplierRatio: number;

  @Prop({
    required: [true, 'adjustedGoldFeedRatio is required'],
    type: Number,
    default: 0,
  })
  adjustedGoldFeedRatio: number;

  @Prop({
    required: [true, 'diamondSupplierRatio is required'],
    type: Number,
    default: 0,
  })
  diamondSupplierRatio: number;

  @Prop({
    required: [true, 'adjustedDiamondFeedRatio is required'],
    type: Number,
    default: 0,
  })
  adjustedDiamondFeedRatio: number;

  @Prop({
    required: [true, 'totalAdjustedRatio is required'],
    type: Number,
    default: 0,
  })
  totalAdjustedRatio: number;

  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  x: number;

  @Prop({
    required: [true, 'diamondDailyFeed is required'],
    type: Number,
    default: 0,
  })
  diamondDailyFeed: number;

  @Prop({
    required: [true, 'goldDailyFeed is required'],
    type: Number,
    default: 0,
  })
  goldDailyFeed: number;

  @Prop({
    required: [true, 'silverDailyFeed is required'],
    type: Number,
    default: 0,
  })
  silverDailyFeed: number;

  @Prop({
    required: [true, 'bronzeDailyFeed is required'],
    type: Number,
    default: 0,
  })
  bronzeDailyFeed: number;

  @Prop({
    required: true,
    type: [String],
    default: ['diamond', 'gold', 'silver', 'bronze'],
  })
  subsPriority: string[];
}

export const FeedMouldSchema = SchemaFactory.createForClass(FeedMould);

FeedMouldSchema.pre<any>('save', function (next) {
  // do stuff
  console.log('pre save', this);
  this.monthlyFeed = (this.monthlyTarget * this.supplierRatio) | 0;

  this.dailyTarget = Number(((this.monthlyTarget / 30) | 0).toFixed(2));
  this.dailyFeed = Math.round(this.dailyTarget * this.supplierRatio);

  this.lowestSupplierCount = Math.min(
    this.totalBronzeSupplier,
    this.totalSilverSupplier,
    this.totalGoldSupplier,
    this.totalDiamondSupplier,
  );

  this.bronzeSupplierRatio = Number(
    ((this.totalBronzeSupplier / this.lowestSupplierCount) | 0).toFixed(2),
  );
  this.adjustedBronzeFeedRatio =
    (this.bronzeSupplierRatio * this.bronzeFeedRatio) | 0;

  this.silverSupplierRatio = Number(
    ((this.totalSilverSupplier / this.lowestSupplierCount) | 0).toFixed(2),
  );
  this.adjustedSilverFeedRatio =
    (this.silverSupplierRatio * this.silverFeedRatio) | 0;

  this.goldSupplierRatio = Number(
    ((this.totalGoldSupplier / this.lowestSupplierCount) | 0).toFixed(2),
  );
  this.adjustedGoldFeedRatio =
    (this.goldSupplierRatio * this.goldFeedRatio) | 0;

  this.diamondSupplierRatio = Number(
    ((this.totalGoldSupplier / this.lowestSupplierCount) | 0).toFixed(2),
  );
  this.adjustedDiamondFeedRatio =
    (this.diamondSupplierRatio * this.diamondFeedRatio) | 0;

  this.totalAdjustedRatio =
    (this.adjustedDiamondFeedRatio +
      this.adjustedGoldFeedRatio +
      this.adjustedSilverFeedRatio +
      this.adjustedBronzeFeedRatio) |
    0;

  this.x = Number(((this.dailyFeed / this.totalAdjustedRatio) | 0).toFixed(4));

  this.diamondDailyFeed = Number(
    ((this.x * this.adjustedDiamondFeedRatio) | 0).toFixed(2),
  );
  this.goldDailyFeed = Number(
    ((this.x * this.adjustedGoldFeedRatio) | 0).toFixed(2),
  );
  this.silverDailyFeed = Number(
    ((this.x * this.adjustedSilverFeedRatio) | 0).toFixed(2),
  );
  this.bronzeDailyFeed = Number(
    ((this.x * this.adjustedBronzeFeedRatio) | 0).toFixed(2),
  );

  next();
});

// Pre hook for `findOneAndUpdate`
FeedMouldSchema.pre<any>(/find/, function (next) {
  this.options.runValidators = true;
  next();
});

FeedMouldSchema.index({ createdAt: 1, updatedAt: 1 });
