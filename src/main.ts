import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Debug: Confirm environment variables are loading correctly (sanitized)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (uri) {
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`[DEBUG] MongoDB URI is present: ${maskedUri}`);
  } else {
    console.warn('[DEBUG] MongoDB URI is MISSING from process.env');
  }

  const port = process.env.PORT || 8080;
  console.log(`[DEBUG] App will listen on port: ${port}`);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(port);
}
void bootstrap();
