import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './services/messages.service';
import { ConversationsService } from './services/conversations.service';
import { MessagesController } from './controllers/messages.controller';
import { ConversationsController } from './controllers/conversations.controller';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      Conversation,
      ConversationParticipant,
      User,
    ]),
  ],
  controllers: [MessagesController, ConversationsController],
  providers: [MessagesService, ConversationsService],
  exports: [MessagesService, ConversationsService],
})
export class MessagesModule {}
