export interface ISupplierAddManuallyEventDto {
  bookingId: number;
  supplierIds: string[];
}

export class AnnounceSupplierAddManuallyCommand {
  constructor(readonly body: ISupplierAddManuallyEventDto) {}
}
