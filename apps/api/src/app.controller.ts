import { Controller, Get } from '@nestjs/common';
import { ALL_DELIVERY_STATUSES, API_VERSION, APP_NAME } from '@repo/shared';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      name: APP_NAME,
      version: API_VERSION,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('meta')
  getMeta() {
    return {
      apiVersion: API_VERSION,
      appName: APP_NAME,
      deliveryStatusCount: ALL_DELIVERY_STATUSES.length,
      deliveryStatuses: ALL_DELIVERY_STATUSES,
    };
  }
}
