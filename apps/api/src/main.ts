import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  console.warn(`API listening on http://localhost:${port}/api/v1`);
}

bootstrap();
