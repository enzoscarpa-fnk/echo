import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('conversations/:conversationId/messages')
@UseGuards(ClerkAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    /**
     * POST /api/conversations/:conversationId/messages
     * Send a message in a conversation
     */
    @Post()
    async create(
        @Param('conversationId') conversationId: string,
        @Req() req: any,
        @Body() createMessageDto: CreateMessageDto,
    ) {
        return this.messagesService.create(
            conversationId,
            req.user.id,
            createMessageDto,
        );
    }

    /**
     * GET /api/conversations/:conversationId/messages
     * Get all messages in a conversation
     */
    @Get()
    async findAll(
        @Param('conversationId') conversationId: string,
        @Req() req: any,
    ) {
        return this.messagesService.findAll(conversationId, req.user.id);
    }

    /**
     * POST /api/conversations/:conversationId/messages/read
     * Mark messages as read
     */
    @Post('read')
    async markAsRead(
        @Param('conversationId') conversationId: string,
        @Req() req: any,
    ) {
        return this.messagesService.markAsRead(conversationId, req.user.id);
    }

    /**
     * GET /api/conversations/:conversationId/messages/:id
     * Get a specific message
     */
    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        return this.messagesService.findOne(id, req.user.id);
    }

    /**
     * PATCH /api/conversations/:conversationId/messages/:id
     * Update a message
     */
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Req() req: any,
        @Body() updateMessageDto: UpdateMessageDto,
    ) {
        return this.messagesService.update(id, req.user.id, updateMessageDto);
    }

    /**
     * DELETE /api/conversations/:conversationId/messages/:id
     * Delete a message
     */
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        return this.messagesService.remove(id, req.user.id);
    }
}
