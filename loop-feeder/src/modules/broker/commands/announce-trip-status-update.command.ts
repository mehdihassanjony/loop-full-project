export enum TripStatus {
  ON_WAY = 'on_way',
  COMPLETED = 'completed',
}

export enum TripType {
  RETURN_TRIP = 'return_trip',
  REGULAR_TRIP = 'regular_trip',
}

export interface ITripStatusUpdateEventDto {
  shipperId: string;
  vendorId: string;
  supplierId: string;
  shipperName: string;
  vendorName: string;
  bookingId: number;
  tripId: number;
  tripStatus: TripStatus;
  companyId: number;
  supplierAmount: number;
  tripType: TripType;
}
export class AnnounceTripStatusUpdateCommand {
  constructor(readonly body: ITripStatusUpdateEventDto) {}
}
