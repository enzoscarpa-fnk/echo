import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { ClerkAuthGuard } from '../../auth/clerk-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(ClerkAuthGuard) // All routes require authentication
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    // POST /messages - Create a new message
    @Post()
    create(
        @Body() createMessageDto: CreateMessageDto,
        @CurrentUser() user: any,
    ) {
        return this.messagesService.create(createMessageDto, user.id);
    }

    // GET /messages?conversationId=xxx - Get all messages in a conversation
    @Get()
    findAll(
        @Query('conversationId') conversationId: string,
        @CurrentUser() user: any,
    ) {
        return this.messagesService.findAllInConversation(conversationId, user.id);
    }

    // PATCH /messages/:id - Update a message
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMessageDto: UpdateMessageDto,
        @CurrentUser() user: any,
    ) {
        return this.messagesService.update(id, updateMessageDto, user.id);
    }

    // DELETE /messages/:id - Delete a message
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.messagesService.remove(id, user.id);
    }
}
