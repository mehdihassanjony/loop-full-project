export enum Consumer {
  BOOKING_QUEUE = 'booking.events.queue',
  BOOKING_EXCHANGE = 'booking.events.exchange',
  BOOKING_CREATE_ROUTING_KEY = 'booking.events.booking.create',
  MANUALLY_ADD_SUPPLIER_ROUTING_KEY = 'booking.events.supplier.add.manually',
  TRIP_STATUS_UPDATE_ROUTING_KEY = 'booking.events.trip.status.update',

  FEED_QUEUE = 'feed.events.queue',
  FEED_EXCHANGE = 'feed.events.exchange',
  SUPPLIER_FEED_SYNC_ROUTING_KEY = 'feed.events.supplier.sync',

  // user events
  SUPPLIER_CREATE_ROUTING_KEY = 'user.events.supplier.create',
  SUPPLIER_USER_UPDATE_ROUTING_KEY = 'user.events.supplier.update',

  // supplier events
  SUPPLIER_UPDATE_ROUTING_KEY = 'supplier.events.supplier.update',
}
