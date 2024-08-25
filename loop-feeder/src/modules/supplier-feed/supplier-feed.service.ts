import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupplierService } from '../../common/services/supplier.service';
import { ISupplierAddManuallyEventDto } from '../broker/commands/announce-supplier-add-manually.command';
import {
  ITripStatusUpdateEventDto,
  TripStatus,
  TripType,
} from '../broker/commands/announce-trip-status-update.command';
import { AdminFilterSupplierFeedDto } from './dtos/admin-filter-supplier-feed.dto';
import { AdminSupplierFeedSummaryDto } from './dtos/admin-supplier-feed-summary.dto';
import { SupplierFeed, SupplierFeedDocument } from './supplier-feed.entity';
import * as moment from 'moment-timezone';
import {
  SupplierFeedHistory,
  SupplierFeedHistoryDocument,
} from './supplier-feed-history.entity';
import {
  SupplierReturnFeed,
  SupplierReturnFeedDocument,
} from './supplier-return-feed.entity';
import {
  SupplierReturnFeedHistory,
  SupplierReturnFeedHistoryDocument,
} from './supplier-return-feed-history.entity';

@Injectable()
export class SupplierFeedService {
  constructor(
    @InjectModel(SupplierFeed.name)
    private supplierModel: Model<SupplierFeedDocument>,
    @InjectModel(SupplierReturnFeed.name)
    private returnFdModel: Model<SupplierReturnFeedDocument>,
    @InjectModel(SupplierFeedHistory.name)
    private supFeedHisModel: Model<SupplierFeedHistoryDocument>,
    @InjectModel(SupplierReturnFeedHistory.name)
    private supReturnFeedHistoryModel: Model<SupplierReturnFeedHistoryDocument>,
    private supService: SupplierService,
  ) {}

  public async create(
    vendors: string[],
    mode: 'assignedFeedCount' | 'marketPlaceFeedCount',
  ) {
    const updateQ = [];
    const now = Date.now();
    vendors.forEach((id: string) => {
      updateQ.push({
        updateOne: {
          filter: { userId: id },
          update: {
            $inc: { [mode]: 1, totalFeedCount: 1 },
            $set: { lastFeedAt: now },
          },
          upsert: true,
        },
      });
    });
    return await this.supplierModel.bulkWrite(updateQ);
  }

  public async getSupplierWithoutDefault(
    suppliers: string[],
  ): Promise<
    { _id: string; marketPlaceFeedCount: number; vendors: SupplierFeed[] }[]
  > {
    const supp = await this.supplierModel.aggregate([
      {
        $match: {
          $and: [
            {
              userId: {
                $in: suppliers,
              },
            },
            {
              subsType: { $nin: ['platinum', 'tin'] },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          vendors: { $addToSet: '$$ROOT' },
        },
      },
      {
        $unwind: '$vendors',
      },
      {
        $sort: {
          // marketPlaceFeedCount is temporary disabled, it will enabled later.
          // disabled for in the middle of month supplier added

          // 'vendors.marketPlaceFeedCount': 1,
          'vendors.lastFeedAt': 1,
        },
      },
      {
        $group: {
          _id: '$vendors.subsType',
          marketPlaceFeedCount: { $sum: '$vendors.marketPlaceFeedCount' },
          vendors: { $push: '$vendors' },
        },
      },
    ]);
    return supp;
  }

  public async getDefaultSupplier(
    suppliers: string[],
  ): Promise<
    { _id: string; marketPlaceFeedCount: number; vendors: SupplierFeed[] }[]
  > {
    const supp = await this.supplierModel.aggregate([
      {
        $match: {
          $and: [
            {
              userId: {
                $in: suppliers,
              },
            },
            {
              subsType: { $in: ['platinum', 'tin'] },
            },
            {
              status: { $eq: 'active' },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          vendors: { $addToSet: '$$ROOT' },
        },
      },
      {
        $unwind: '$vendors',
      },
      {
        $sort: {
          // marketPlaceFeedCount is temporary disabled, it will enabled later.
          // disabled for in the middle of month supplier added

          // 'vendors.marketPlaceFeedCount': 1,
          'vendors.lastFeedAt': 1,
        },
      },
      {
        $group: {
          _id: '$vendors.subsType',
          marketPlaceFeedCount: { $sum: '$vendors.marketPlaceFeedCount' },
          vendors: { $push: '$vendors' },
        },
      },
    ]);
    return supp;
  }

  public async getSupplierFeed(filter: AdminFilterSupplierFeedDto) {
    const { page, limit, subsType, zone, query } = filter;
    const match = {};
    if (zone) match['zone'] = { $regex: zone };
    if (subsType) match['subsType'] = subsType;
    if (query)
      match['$or'] = [
        { 'user.fullName': { $regex: query, $options: 'i' } },
        { 'user.companyName': { $regex: query, $options: 'i' } },
      ];
    const pCount = this.supplierModel.find(match).countDocuments();
    const pFeed = this.supplierModel
      .find(match)
      .limit(limit)
      .skip(limit * (page - 1))
      .sort('-updatedAt')
      .select([
        '-_id',
        'userId',
        'assignedFeedCount',
        'marketPlaceFeedCount',
        'manualFeedCount',
        'totalFeedCount',
        'subsType',
        'makePayout',
        'createdAt',
        'user',
      ]);
    const promises = await Promise.allSettled([pCount, pFeed]);
    const count: number = promises[0]['value'];
    const feed: SupplierFeedDocument[] = promises[1]['value'];
    // const [feed] = await this.supplierModel.aggregate([
    //   { $match: match },
    //   // {
    //   //   $group: {
    //   //     _id: null,
    //   //     // userId: '$userId',
    //   //     // assignedFeedCount: '$assignedFeedCount',
    //   //     // marketPlaceFeedCount: '$marketPlaceFeedCount',
    //   //     // manualFeedCount: '$manualFeedCount',
    //   //     // totalFeedCount: '$totalFeedCount',
    //   //     // subsType: '$subsType',
    //   //     // makePayout: '$makePayout',
    //   //     // createdAt: '$createdAt',
    //   //     // user: '$user',
    //   //   },
    //   //   // suppliers: { $push: '$$ROOT' },
    //   //   // },
    //   // },
    //   {
    //     $project: {
    //       _id: 0,
    //       userId: 1,
    //       assignedFeedCount: 1,
    //       marketPlaceFeedCount: 1,
    //       manualFeedCount: 1,
    //       totalFeedCount: 1,
    //       subsType: 1,
    //       makePayout: 1,
    //       createdAt: 1,
    //       user: 1,
    //     },
    //   },
    //   {
    //     $facet: {
    //       totalDocs: [{ $count: 'total' }],
    //       data: [
    //         { $sort: { updatedAt: -1 } },
    //         { $skip: (page - 1) * limit },
    //         { $limit: limit },
    //       ],
    //     },
    //   },
    //   {
    //     $project: {
    //       count: { $arrayElemAt: ['$totalDocs.total', 0] },
    //       data: '$data',
    //     },
    //   },
    // ]);
    //console.log(feed);
    return { data: feed, count };
  }

  public async supplierFeedSummary(q: AdminSupplierFeedSummaryDto) {
    const { zone, startDate } = q;
    const match = {};
    if (zone) match['zone'] = { $regex: zone };
    if (startDate) {
      const start: Date = moment(startDate)
        .startOf('month')
        .tz('Asia/Dhaka')
        .set({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
        .toDate();
      const end: Date = moment(startDate)
        .endOf('month')
        .tz('Asia/Dhaka')
        .set({ hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
        .toDate();
      match['createdAt'] = {
        $gte: start,
        $lte: end,
      };
    }
    // select which collection data need to fetched.
    // if startDate data in previous date the fetch from supplierHistory collection
    const currentDate = moment().tz('Asia/Dhaka');
    const fetchData = moment(startDate).tz('Asia/Dhaka');
    const monthDiff = moment([currentDate.year(), currentDate.month(), 1]).diff(
      moment([fetchData.year(), fetchData.month(), 1]),
      'months',
    );
    const selectModel =
      monthDiff > 0 ? this.supFeedHisModel : this.supplierModel;
    const [summary] = await selectModel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,
          totalDedicatedFeedCount: {
            $sum: '$assignedFeedCount',
          },
          marketPlaceFeedCount: {
            $sum: '$marketPlaceFeedCount',
          },
          manualFeedCount: {
            $sum: '$manualFeedCount',
          },
          platinumFeedAmount: {
            $sum: {
              $cond: [{ $eq: ['$subsType', 'platinum'] }, '$totalAmount', 0],
            },
          },
          diamondFeedAmount: {
            $sum: {
              $cond: [{ $eq: ['$subsType', 'diamond'] }, '$totalAmount', 0],
            },
          },
          goldFeedAmount: {
            $sum: {
              $cond: [{ $eq: ['$subsType', 'gold'] }, '$totalAmount', 0],
            },
          },
          silverFeedAmount: {
            $sum: {
              $cond: [{ $eq: ['$subsType', 'silver'] }, '$totalAmount', 0],
            },
          },
          bronzeFeedAmount: {
            $sum: {
              $cond: [{ $eq: ['$subsType', 'bronze'] }, '$totalAmount', 0],
            },
          },
          tinFeedAmount: {
            $sum: {
              $cond: [{ $eq: ['$subsType', 'tin'] }, '$totalAmount', 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalDedicatedFeedCount: 1,
          marketPlaceFeedCount: 1,
          manualFeedCount: 1,
          platinumFeedAmount: 1,
          diamondFeedAmount: 1,
          goldFeedAmount: 1,
          silverFeedAmount: 1,
          bronzeFeedAmount: 1,
          tinFeedAmount: 1,
        },
      },
    ]);
    return summary;
  }

  // group by with subtype
  public async allSupplierGroups() {
    const supp = await this.supplierModel.aggregate([
      {
        $match: {
          subsType: { $ne: 'platinum' },
        },
      },
      {
        $group: {
          _id: null,
          vendors: { $addToSet: '$$ROOT' },
        },
      },
      {
        $unwind: '$vendors',
      },
      { $sort: { 'vendors.marketPlaceFeedCount': 1, 'vendors.lastFeedAt': 1 } },
      {
        $group: {
          _id: '$vendors.subsType',
          marketPlaceFeedCount: { $sum: '$vendors.marketPlaceFeedCount' },
          vendors: { $push: '$vendors' },
        },
      },
    ]);
    return supp;
  }

  public async getSupplierCountByCluster() {
    const sup = await this.supplierModel.aggregate([
      { $unwind: '$zone' },
      {
        $match: { subsType: { $in: ['bronze', 'silver', 'gold', 'diamond'] } },
      },
      {
        $group: {
          _id: {
            subsType: '$subsType',
            zone: '$zone',
          },
          totalSupplier: { $sum: 1 },
          vendors: { $addToSet: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          zone: '$_id.zone',
          subsType: '$_id.subsType',
          totalSupplier: '$totalSupplier',
          vendors: '$vendors',
        },
      },
    ]);
    const data = {};
    for (const vendor of sup) {
      if (!data[vendor.zone]) data[vendor.zone] = [];
      data[vendor.zone].push({
        zone: vendor.zone,
        subsType: vendor.subsType,
        totalSupplier: vendor.totalSupplier,
      });
    }
    return data;
  }

  public async storeSupplier(
    ids: string[],
    page: number = 1,
    count: number = 500,
  ) {
    const suppliersResponse: any[] = await this.supService.getAllSupplier(
      ids,
      page,
      count,
    );
    const suppliers = [];
    const returnSuppliers = [];
    for (const sup of suppliersResponse) {
      if (!sup.assignCluster.zone) {
        Logger.log(JSON.stringify(sup, null, 3), 'UserZoneNotFound');
        continue;
      }
      const exists: SupplierFeedDocument = await this.supplierModel.findOne({
        userId: sup.userId,
      });
      const returnFeedExists: SupplierReturnFeedDocument =
        await this.returnFdModel.findOne({
          userId: sup.userId,
        });
      if (returnFeedExists) {
        Object.keys(sup).forEach((key) => {
          returnFeedExists[key] = sup[key];
        });
        returnFeedExists.user = {
          userId: sup.userId,
          fullName: sup.fullName,
          phone: sup.phone,
          email: sup.email,
          profilePicture: sup.profilePicture,
          role: sup.role,
          companyName: sup.companyName,
        };
        Logger.log(JSON.stringify(exists, null, 3), 'ExistsReturnUpdate');
        await returnFeedExists.save();
      } else {
        returnSuppliers.push({
          userId: sup.userId,
          subsType: sup.subsType,
          makePayout: sup.makePayout,
          zone: sup.assignCluster.zone,
          user: {
            userId: sup.userId,
            fullName: sup.fullName,
            phone: sup.phone,
            email: sup.email,
            profilePicture: sup.profilePicture,
            role: sup.role,
            companyName: sup.companyName,
          },
        });
      }
      if (exists) {
        Object.keys(sup).forEach((key) => {
          exists[key] = sup[key];
        });
        exists.user = {
          userId: sup.userId,
          fullName: sup.fullName,
          phone: sup.phone,
          email: sup.email,
          profilePicture: sup.profilePicture,
          role: sup.role,
          companyName: sup.companyName,
        };
        Logger.log(JSON.stringify(exists, null, 3), 'ExistsUserUpdate');
        await exists.save();
      } else {
        suppliers.push({
          userId: sup.userId,
          subsType: sup.subsType,
          makePayout: sup.makePayout,
          zone: sup.assignCluster.zone,
          user: {
            userId: sup.userId,
            fullName: sup.fullName,
            phone: sup.phone,
            email: sup.email,
            profilePicture: sup.profilePicture,
            role: sup.role,
            companyName: sup.companyName,
          },
        });
      }
    }
    await this.returnFdModel.insertMany(returnSuppliers);
    return await this.supplierModel.insertMany(suppliers);
  }

  public async updateSupplierManualFeedCount(
    body: ISupplierAddManuallyEventDto,
  ): Promise<boolean> {
    await this.supplierModel.updateMany(
      { userId: { $in: body.supplierIds } },
      { $inc: { manualFeedCount: 1 } },
    );
    return true;
  }

  public async updateSupplierAmount(
    body: ITripStatusUpdateEventDto,
  ): Promise<boolean> {
    Logger.log(JSON.stringify(body, null, 3), 'TripStatusUpdate');
    if (body.tripStatus !== TripStatus.COMPLETED) return true;
    if (body.tripType === TripType.REGULAR_TRIP)
      await this.supplierModel.updateOne(
        { userId: body.supplierId },
        {
          $inc: { totalAmount: body.supplierAmount },
        },
      );
    else
      await this.returnFdModel.updateOne(
        { userId: body.supplierId },
        {
          $inc: { totalAmount: body.supplierAmount },
        },
      );
    return true;
  }

  public async resetSupplierFeed(): Promise<boolean> {
    const supHistories: SupplierFeedHistory[] = [];
    // normal/regular supplier feed
    const supPrevFeed: SupplierFeed[] = await this.supplierModel
      .find()
      .select('-_id -createdAt -updatedAt');
    const currentDate: Date = moment()
      .tz('Asia/Dhaka')
      .startOf('months')
      .second(1)
      .toDate();
    const prevMonth: Date = moment()
      .tz('Asia/Dhaka')
      .subtract(1, 'months')
      .startOf('months')
      .second(1)
      .toDate();
    for (const prevFeed of supPrevFeed) {
      supHistories.push({
        userId: prevFeed.userId,
        user: prevFeed.user,
        marketPlaceFeedCount: prevFeed.marketPlaceFeedCount,
        assignedFeedCount: prevFeed.assignedFeedCount,
        totalFeedCount: prevFeed.totalFeedCount,
        totalAmount: prevFeed.totalAmount,
        subsType: prevFeed.subsType,
        makePayout: prevFeed.makePayout,
        zone: prevFeed.zone,
        manualFeedCount: prevFeed.manualFeedCount,
        lastFeedAt: prevFeed.lastFeedAt,
        createdAt: prevMonth,
        updatedAt: prevMonth,
        status: prevFeed.status,
      });
    }
    // return supplier feed
    const returnSupHistories: SupplierReturnFeedHistory[] = [];
    const returnPrevSuppliers: SupplierReturnFeed[] = await this.returnFdModel
      .find()
      .select('-_id -createdAt -updatedAt');
    for (const returnPresSup of returnPrevSuppliers) {
      returnSupHistories.push({
        userId: returnPresSup.userId,
        user: returnPresSup.user,
        totalFeedCount: returnPresSup.totalFeedCount,
        totalAmount: returnPresSup.totalAmount,
        subsType: returnPresSup.subsType,
        makePayout: returnPresSup.makePayout,
        zone: returnPresSup.zone,
        createdAt: prevMonth,
        updatedAt: prevMonth,
        status: returnPresSup.status,
      });
    }
    // update regular supplier collection data.
    await this.supFeedHisModel.insertMany(supHistories);
    await this.supplierModel.updateMany(
      {},
      {
        $set: {
          marketPlaceFeedCount: 0,
          assignedFeedCount: 0,
          totalFeedCount: 0,
          totalAmount: 0,
          manualFeedCount: 0,
          createdAt: currentDate,
        },
      },
      { strict: false, timestamps: false },
    );

    // update return supplier collection data.
    await this.supReturnFeedHistoryModel.insertMany(returnSupHistories);
    await this.returnFdModel.updateMany(
      {},
      { $set: { totalFeedCount: 0, totalAmount: 0, createdAt: currentDate } },
      { strict: false, timestamps: false },
    );
    return true;
  }

  public async updateReturnSupplierInfo(vendors: string[]) {
    const updateQ = [];
    const now: number = Date.now();
    vendors.forEach((id: string) => {
      updateQ.push({
        updateOne: {
          filter: { userId: id },
          update: {
            $inc: { totalFeedCount: 1 },
            $set: { lastFeedAt: now },
          },
          upsert: true,
        },
      });
    });
    return await this.supplierModel.bulkWrite(updateQ);
  }
}
