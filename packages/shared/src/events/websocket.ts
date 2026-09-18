export const WS_EVENTS = {
  // Server → Client
  DELIVERY_STATUS_CHANGED: 'delivery.status_changed',
  DELIVERY_DRIVER_LOCATION: 'delivery.driver_location',
  DELIVERY_OFFER: 'delivery.offer',
  NOTIFICATION_NEW: 'notification.new',
  ADMIN_DRIVER_POSITIONS: 'admin.driver_positions',

  // Client → Server
  DRIVER_LOCATION_UPDATE: 'driver.location_update',
  JOIN_DELIVERY_ROOM: 'join_delivery_room',
  LEAVE_DELIVERY_ROOM: 'leave_delivery_room',
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
