import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupplierService } from '../../common/services/supplier.service';
import { SupplierFeed } from '../supplier-feed/supplier-feed.entity';
import { SupplierFeedService } from '../supplier-feed/supplier-feed.service';
import {
  FeedBlendingDto,
  FeedType,
  SuppliersWithFeedType,
} from './dtos/feed-blending.dto';
import { CreateFeedMouldDto } from './dtos/create-feed-mould.dto';
import { FeedMould, FeedMouldDocument } from './feed-mould.entity';
import { IVendor } from './interfaces/vendor-interface';
import { UpdateFeedMouldDto } from './dtos/update-feed-mound.dto';
import { AnnounceSupplierFeedSyncCommand } from '../broker/commands/announce-supplier-feed-sync.command';
import { Feed, FeedDocument } from './feed.entity';
import { ReturnFeedService } from '../return-feed/return-feed.service';

@Injectable()
export class FeedService {
  protected subsPriority: string[] = ['diamond', 'gold', 'silver', 'bronze'];
  protected startingPosition: number = 0;

  constructor(
    @InjectModel(FeedMould.name)
    private feedMouldModel: Model<FeedMouldDocument>,
    @InjectModel(Feed.name) private feedModel: Model<FeedDocument>,
    private suppFeedService: SupplierFeedService,
    private returnFeedService: ReturnFeedService,
    private supService: SupplierService,
    private commandBus: CommandBus,
  ) {}

  public async blendingFeed(body: FeedBlendingDto): Promise<any> {
    console.log('body', body.fromDistrict);
    const { slug, fromDistrict, isSlugActive, truckCategory } = body;
    let eligibleVendors: SupplierFeed[] = [],
      mode: 'assignedFeedCount' | 'marketPlaceFeedCount',
      reason: string = '';
    // called supplier service to getting supplier list
    let suppliers: IVendor[] = [];
    let defaultSuppliers: IVendor[] = [];
    let supplierPrevData = [];

    if (isSlugActive) {
      suppliers = await this.supService.getSupplierList(
        fromDistrict.addressLocale.en,
        truckCategory.nameEn,
        slug,
      );
      // eligibleVendors = suppliers as any[];
      console.log('feed disburse from slugging', suppliers);

      const supplierPreviousAnalytics =
        await this.suppFeedService.getDefaultSupplier(
          suppliers.map((vend) => vend.userId),
        );

      const prevPlatinumSupp = supplierPreviousAnalytics.find(
        (vend) => vend._id === 'platinum',
      );
      console.log('prevPlatinumSupp', prevPlatinumSupp);
      if (prevPlatinumSupp)
        for (const prevSupp of prevPlatinumSupp.vendors) {
          const findSupplier = suppliers.find(
            (sup) => sup.userId === prevSupp.userId,
          );
          if (findSupplier) {
            if (prevSupp.assignedFeedCount <= findSupplier.monthlyFeed)
              eligibleVendors.push(prevSupp);
          }
        }

      const eligibleSupplierIds: string[] = eligibleVendors.map(
        (vend) => vend.userId,
      );

      if (eligibleSupplierIds.length) {
        mode = 'assignedFeedCount';
        body.suppliers = eligibleSupplierIds;
        reason = 'supplier feed disburse using company slug.';
        await this.publishedAndStoreSupplierFeed(
          eligibleVendors,
          body,
          mode,
          reason,
        );
        return true;
      }
      reason = `company slugging was active. There was ${eligibleSupplierIds.length} eligible supplier found.
       there was not assignedFeedCount limit left. so feed distribute to market place.`;
    }
    // get all supplier service by using district and truckSize.
    suppliers = await this.supService.getSupplierList(
      fromDistrict.addressLocale.en,
      truckCategory.nameEn,
    );
    if (!suppliers.length) {
      console.log('Vendor not found with the given criteria');
      // throw new BadRequestException(
      //   'Vendor not found with the given criteria.',
      // );
      return true;
    }
    console.log('total supplier found', suppliers);

    let defSupp = [],
      supp = [];
    suppliers.forEach((sup) => {
      if (
        sup.subsType.toLowerCase() === 'tin' ||
        sup.subsType.toLowerCase() === 'platinum'
      )
        defSupp.push(sup);
      else supp.push(sup);
    });
    defaultSuppliers = defSupp;
    suppliers = supp;

    let finalVendors: SupplierFeed[] = [];
    // fetch supplier previous history by using supplier list
    supplierPrevData = await this.suppFeedService.getSupplierWithoutDefault(
      suppliers.map((vend) => vend.userId),
    );
    // find supplier zone info.
    const mouldVendor = await this.findMouldByZone(body.zone);
    if (!mouldVendor) {
      //  throw new BadRequestException('Invalid cluster zone.');
      console.log('Invalid cluster zone');
      return true;
    }

    // generate subscription priority by round robin fashion
    let genPriorities: string[] = [];

    console.log('supplierPrevData', supplierPrevData.length);
    if (supplierPrevData.length >= 4)
      genPriorities = this.generateSubsPriority(mouldVendor.subsPriority);
    else genPriorities = supplierPrevData.map((sup) => sup._id);

    console.log('vendor without tin and platinum', suppliers);

    if (supplierPrevData.length >= 3) {
      const wednesdayPayoutCount: number = suppliers.filter(
        (vend) => vend.makePayout === 'wednesday',
      ).length;
      const mondayPayoutCount: number = suppliers.filter(
        (vend) => vend.makePayout === 'monday',
      ).length;

      // console.log('wednesdayPayoutCount', wednesdayPayoutCount);
      // console.log('mondayPayoutCount', mondayPayoutCount);

      if (wednesdayPayoutCount > 0 && mondayPayoutCount > 0) {
        // console.log('here................................');
        // console.log('eligibleVendors', eligibleVendors);
        // console.log('finalVendors', finalVendors);

        // console.log('mouldVendor.subsPriority', genPriorities);

        for (const subs of genPriorities) {
          const grpSupp = supplierPrevData.find(
            (sup) => sup._id.toLowerCase() === subs.toLowerCase(),
          );
          if (!grpSupp) continue;
          const { _id, marketPlaceFeedCount, vendors } = grpSupp;
          for (const vendor of vendors) {
            const capitalizeSubs = subs.replace(/\b\w/, (v) => v.toUpperCase());
            const feedLimitPerClass =
              mouldVendor.x *
              30 *
              mouldVendor[`adjusted${capitalizeSubs}FeedRatio`];

            console.log('feedLimitPerClass', feedLimitPerClass);
            console.log('marketPlaceFeedCount', marketPlaceFeedCount);
            if (feedLimitPerClass >= marketPlaceFeedCount) {
              finalVendors.push(vendor);
              break;
            }
          }
          //console.log('vendors list', finalVendors);
        }
        const hasWednesdayPayout: number = finalVendors.findIndex(
          (vend) => vend.makePayout === 'wednesday',
        );
        const hasMondayPayout: number = finalVendors.findIndex(
          (vend) => vend.makePayout === 'monday',
        );

        console.log('hasWednesdayPayout', hasWednesdayPayout);
        console.log('hasMondayPayout', hasMondayPayout);
        if (hasWednesdayPayout === -1 || hasMondayPayout === -1) {
          let genPriorities: string[] = [];
          if (supplierPrevData.length >= 4)
            genPriorities = this.generateSubsPriority(mouldVendor.subsPriority);
          else genPriorities = supplierPrevData.map((sup) => sup._id);

          finalVendors = [];

          for (const subs of genPriorities) {
            const grpSupp = supplierPrevData.find(
              (sup) => sup._id.toLowerCase() === subs.toLowerCase(),
            );
            if (!grpSupp) continue;

            const { _id, marketPlaceFeedCount, vendors } = grpSupp;
            for (const vendor of vendors) {
              const capitalizeSubs = subs.replace(/\b\w/, (v) =>
                v.toUpperCase(),
              );
              const feedLimitPerClass =
                mouldVendor.x *
                30 *
                mouldVendor[`adjusted${capitalizeSubs}FeedRatio`];

              console.log('feedLimitPerClass', feedLimitPerClass);
              console.log('marketPlaceFeedCount', marketPlaceFeedCount);
              if (feedLimitPerClass >= marketPlaceFeedCount) {
                finalVendors.push(vendor);
                break;
              }
            }
          }
          reason += ` in final supplier list wednesday or monday are not present. so adjust the supplier by rerun the logic.`;
        } else
          reason += ` final supplier list wednesday or monday are not present. so distribute them equally.`;
      } else {
        for (const subs of genPriorities) {
          const grpSupp = supplierPrevData.find(
            (sup) => sup._id.toLowerCase() === subs.toLowerCase(),
          );
          if (!grpSupp) continue;

          const { _id, marketPlaceFeedCount, vendors } = grpSupp;
          for (const vendor of vendors) {
            const capitalizeSubs = subs.replace(/\b\w/, (v) => v.toUpperCase());
            const feedLimitPerClass =
              mouldVendor.x *
              30 *
              mouldVendor[`adjusted${capitalizeSubs}FeedRatio`];

            if (feedLimitPerClass >= marketPlaceFeedCount) {
              finalVendors.push(vendor);
              break;
            }
          }
        }
        reason += ` there are both wednesday and monday payout supplier present in supplier list.`;
      }
    } else {
      if (supplierPrevData.length === 1) {
        reason += ` total 1 supplier found from calculation previous data. so feed disburse one supplier only.`;
        finalVendors.push(...supplierPrevData[0].vendors.slice(0, 3));
      } else {
        let retryCount: number = 0;
        while (finalVendors.length <= 2 && retryCount < 5) {
          for (const supp of supplierPrevData) {
            if (finalVendors.length <= 2)
              finalVendors.push(
                ...supp.vendors.slice(retryCount, 1 + retryCount),
              );
          }
          console.log('retryCount', retryCount);
          retryCount++;
        }
        reason += ` total ${supplierPrevData.length} supplier found from calculation previous data. supplier adjust by retrying ${retryCount} times.`;
      }
    }
    // somewhere write logging when not supplier found
    // if (!finalVendors.length) return true;

    eligibleVendors = finalVendors;
    mode = 'marketPlaceFeedCount';

    // added tin and platinum default supplier into supplier feed list.
    const prevDefaultSupp = await this.suppFeedService.getDefaultSupplier(
      defaultSuppliers.map((vend) => vend.userId),
    );
    for (const defSup of prevDefaultSupp) {
      eligibleVendors.push(...defSup.vendors.slice(0, 1));
    }
    console.log('defaultSuppliers', defaultSuppliers);

    console.log('eligibleVendors', eligibleVendors);
    const eligibleSupplierIds: string[] = eligibleVendors.map(
      (vend) => vend.userId,
    );
    body.suppliers = eligibleSupplierIds;
    await this.publishedAndStoreSupplierFeed(
      eligibleVendors,
      body,
      mode,
      reason,
    );
    return true;
  }

  public async publishedAndStoreSupplierFeed(
    eligibleSuppliers: SupplierFeed[],
    body: FeedBlendingDto,
    mode: 'assignedFeedCount' | 'marketPlaceFeedCount',
    reason: string,
  ) {
    Logger.log(body.suppliers, 'BeforeFilterSuppliers');
    // called return feed service with new body object ref.
    const returnSuppliers: string[] =
      await this.returnFeedService.blendingReturnFeed(
        JSON.parse(JSON.stringify(body)),
      );
    // removed suppliers from which supplier present into return supplier list
    if (returnSuppliers.length) {
      const toRemove = new Set(returnSuppliers);
      body.suppliers = body.suppliers.filter(
        (sup: string) => !toRemove.has(sup),
      );
    }
    const suppliersWithFeedType: SuppliersWithFeedType[] = [];
    // added normal feed suppliers
    body.suppliers.forEach((userId: string) => {
      suppliersWithFeedType.push({
        userId: userId,
        feedType: FeedType.NORMAL_FEED,
      });
    });
    // return feed suppliers
    returnSuppliers.forEach((userId: string) => {
      suppliersWithFeedType.push({
        userId: userId,
        feedType: FeedType.RETURN_FEED,
      });
    });
    // finally suppliersWithFeedType update event body
    body.suppliersWithFeedType = suppliersWithFeedType;
    body.suppliers = suppliersWithFeedType.map((sup) => sup.userId);
    Logger.log(suppliersWithFeedType, 'SuppliersWithFeedType');
    Logger.log(body.suppliers, 'AfterFilterSuppliers');
    const newFeed: Feed[] = [];
    for (const supplier of eligibleSuppliers) {
      const find = returnSuppliers.find((sup) => sup === supplier.userId);
      if (!find)
        newFeed.push({
          userId: supplier.userId,
          bookingId: body.bookingId,
          feedType: mode,
          makePayout: supplier.makePayout,
          zone: supplier.zone,
          subsType: supplier.subsType,
          reason: reason?.trim(),
        });
    }
    await this.suppFeedService.create(body.suppliers, mode);
    await this.commandBus.execute(new AnnounceSupplierFeedSyncCommand(body));
    this.feedModel.insertMany(newFeed);
    return true;
  }

  // this func takes subscription and return array with 3 subscription
  private generateSubsPriority(mouldPriority: string[]): string[] {
    const localPriority = [...mouldPriority];
    console.log('starting position', this.startingPosition);
    const excludePosition =
      this.startingPosition === 0
        ? this.subsPriority.length - 1
        : this.startingPosition - 1;

    // const excludeSubsType = localPriority[excludePosition];

    localPriority.splice(excludePosition, 1);
    this.startingPosition++;
    if (this.startingPosition >= this.subsPriority.length)
      this.startingPosition = 0;

    console.log('subscription group', localPriority);

    return localPriority;
  }

  public async storeFeedMound(body: CreateFeedMouldDto) {
    const data = await this.suppFeedService.getSupplierCountByCluster();
    const formatBody = {};
    for (const zone of Object.keys(data)) {
      formatBody['clusterZone'] = zone;
      formatBody['monthlyTarget'] = body.monthlyTarget;

      for (const vendor of data[zone]) {
        const capsSubs = vendor.subsType.replace(/\b\w/, (v) =>
          v.toUpperCase(),
        );
        formatBody[`total${capsSubs}Supplier`] = vendor.totalSupplier;
      }
      const found = await this.feedMouldModel.findOne({
        clusterZone: formatBody['clusterZone'],
      });
      if (!found) {
        const newMould = await new this.feedMouldModel(formatBody);
        await newMould.save();
      } else {
        Object.keys(formatBody).forEach((key) => {
          found[key] = formatBody[key];
        });
        await found.save();
      }
    }
    return data;
  }

  public async updateFeedMound(zone: string, body: UpdateFeedMouldDto) {
    const found = await this.feedMouldModel
      .findOne({
        clusterZone: zone.toLowerCase(),
      })
      .select('-__v');
    if (!found) throw new BadRequestException('Invalid zone');
    Object.keys(body).forEach((key) => {
      found[key] = body[key];
    });
    await found.save();
    return found;
  }

  public async findMouldByZone(zone: string) {
    return await this.feedMouldModel.findOne({ clusterZone: zone });
  }
}
