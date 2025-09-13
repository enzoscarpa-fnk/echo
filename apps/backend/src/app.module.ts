import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesController } from './messages/messages.controller';
import { MessagesService } from './messages/messages.service';
import { ClerkStrategy } from './auth/clerk.strategy';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PassportModule,
    ],
    controllers: [
        AppController,        // Garder l'existant
        MessagesController,   // Ajouter le nouveau
    ],
    providers: [
        AppService,          // Garder l'existant
        MessagesService,     // Ajouter le nouveau
        ClerkStrategy,       // Ajouter la stratégie
    ],
})
export class AppModule {}
