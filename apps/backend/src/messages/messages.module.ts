import { Module } from '@nestjs/common';
import { ConversationsController } from './controllers/conversations.controller';
import { MessagesController } from './controllers/messages.controller';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';

@Module({
    controllers: [ConversationsController, MessagesController],
    providers: [ConversationsService, MessagesService],
    exports: [ConversationsService, MessagesService],
})
export class MessagesModule {}