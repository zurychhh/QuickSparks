import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.AUTH_SERVICE_PORT || 3004;
  
  await app.listen(port);
  console.log(`Auth service running on port ${port}`);
}
bootstrap();