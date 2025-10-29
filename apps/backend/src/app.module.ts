import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { MessagesModule } from './messages/messages.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ContactsModule } from './contacts/contacts.module';

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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
