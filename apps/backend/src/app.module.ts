import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagesModule } from './messages/messages.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PusherModule } from "./pusher/pusher.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PassportModule.register({ defaultStrategy: 'clerk' }),
        PrismaModule,
        AuthModule,
        UsersModule,
        ConversationsModule,
        ContactsModule,
        MessagesModule,
        WebhooksModule,
        PusherModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
