export class ProReportTripCountsResultDto {
  createdBookings: number | null = null;
  createdTrips: number | null = null;
  activeTrips: number | null = null;
  completedTrips: number | null = null;
  cancelledTrips: number | null = null;
  expiredTrips: number | null = null;
}
