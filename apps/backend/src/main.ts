import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend communication
    app.enableCors({
        origin: ['http://localhost:3001', 'http://localhost:3000'], // Nuxt dev server
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Backend server running on http://localhost:${port}`);
}
bootstrap();