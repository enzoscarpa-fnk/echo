import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.use(json({ limit: '1mb' }));

    app.use('/webhooks', raw({ type: 'application/json' }));

    const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Enable CORS for frontend
    app.enableCors({
        origin: corsOrigin, // Dynamic CORS
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
