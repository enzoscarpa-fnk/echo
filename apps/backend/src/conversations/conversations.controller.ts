import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('conversations')
@UseGuards(ClerkAuthGuard)
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) {}

    /**
     * POST /api/conversations
     * Create a new conversation
     */
    @Post()
    async create(
        @Req() req: any,
        @Body() createConversationDto: CreateConversationDto,
    ) {
        return this.conversationsService.create(req.user.id, createConversationDto);
    }

    /**
     * GET /api/conversations
     * Get all conversations for the current user
     */
    @Get()
    async findAll(@Req() req: any) {
        return this.conversationsService.findAll(req.user.id);
    }

    /**
     * GET /api/conversations/:id
     * Get a specific conversation
     */
    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        return this.conversationsService.findOne(id, req.user.id);
    }

    /**
     * POST /api/conversations/:id/participants
     * Add a participant to a group conversation
     */
    @Post(':id/participants')
    async addParticipant(
        @Param('id') conversationId: string,
        @Body('userId') userId: string,
        @Req() req: any,
    ) {
        return this.conversationsService.addParticipant(
            conversationId,
            userId,
            req.user.id,
        );
    }

    /**
     * DELETE /api/conversations/:id/participants/:userId
     * Remove a participant from a group conversation
     */
    @Delete(':id/participants/:userId')
    async removeParticipant(
        @Param('id') conversationId: string,
        @Param('userId') userId: string,
        @Req() req: any,
    ) {
        return this.conversationsService.removeParticipant(
            conversationId,
            userId,
            req.user.id,
        );
    }

    /**
     * DELETE /api/conversations/:id
     * Leave/delete a conversation
     */
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        return this.conversationsService.remove(id, req.user.id);
    }
}
