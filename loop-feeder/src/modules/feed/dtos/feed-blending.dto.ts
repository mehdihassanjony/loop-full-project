export interface Locale {
  bn: string;
  en: string;
}
export interface Location {
  address: string;
  latitude: number;
  longitude: number;
  addressLocale: Locale;
}

export interface TruckCategory {
  nameEn: string;
  nameBn: string;
  id: number;
  status: string;
}

export interface TruckSize {
  nameEn: string;
  nameBn: string;
  id: number;
  status: string;
}

export enum FeedType {
  RETURN_FEED = 'return_feed',
  NORMAL_FEED = 'regular_feed',
}

export interface SuppliersWithFeedType {
  feedType: FeedType;
  userId: string;
}

export interface FeedBlendingDto {
  fromDistrict: Location;
  slug: string;
  isSlugActive: boolean;
  bookingId: number;
  truckCategory: TruckCategory;
  zone: string;
  truckSize: TruckSize;
  toDistrict: Location;
  fromLocation: Location;
  toLocation: Location;
  shipperId: string;
  shipperPhone: string;
  shipperName: string;
  truckQuantity: number;
  companyId: number;
  suppliers: string[];
  // feedType: FeedType;
  suppliersWithFeedType: SuppliersWithFeedType[];
}
