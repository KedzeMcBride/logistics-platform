import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      name: 'logistics-api',
      version: '0.0.0',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}