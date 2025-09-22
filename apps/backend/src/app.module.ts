import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { User } from './auth/entities/user.entity';
import { Message } from './messages/entities/message.entity';
import { Conversation } from './messages/entities/conversation.entity';
import { ConversationParticipant } from './messages/entities/conversation-participant.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Message, Conversation, ConversationParticipant],
        synchronize: true, // Only for development
        logging: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
