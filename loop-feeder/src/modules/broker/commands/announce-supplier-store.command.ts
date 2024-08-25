export interface ISupplierStoreEventDto {
  userId: string;
}

export class AnnounceSupplierStoreCommand {
  constructor(readonly body: ISupplierStoreEventDto) {}
}
