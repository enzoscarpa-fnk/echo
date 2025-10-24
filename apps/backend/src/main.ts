import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        rawBody: true,
    });

    // Enable CORS for frontend
    app.enableCors({
        origin: 'http://localhost:3000', // Frontend URL
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Add global prefix 'api' to all routes
    app.setGlobalPrefix('api');

    await app.listen(3001);
    console.log('Backend running on http://localhost:3001');
}
bootstrap();
