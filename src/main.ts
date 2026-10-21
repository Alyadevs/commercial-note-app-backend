import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend démarré sur http://localhost:${port}/api`);
  const conn = mongoose.connection;
  console.log('=== DB CONNECTÉE ===');
  console.log('ReadyState:', conn.readyState); // 1 = connecté
  console.log('Nom de la base:', conn.name);
  console.log('Host:', conn.host);
  console.log('=====================');
}
bootstrap();
