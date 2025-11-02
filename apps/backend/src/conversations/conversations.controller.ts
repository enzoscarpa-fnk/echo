import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Delete,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateParticipantRoleDto } from "./dto/update-participant-role.dto";
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('conversations')
@UseGuards(ClerkAuthGuard)
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) {}

    /**
     * POST /api/conversations/find-or-create/:contactId
     * Find or create a 1:1 conversation with a contact
     */
    @Post('find-or-create/:contactId')
    async findOrCreateWithContact(
        @Param('contactId') contactId: string,
        @Req() req: any,
    ) {
        return this.conversationsService.findOrCreateWithContact(
            req.user.id,
            contactId,
        );
    }

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
     * PATCH /api/conversations/:id
     * Update conversation name (rename)
     */
    @Patch(':id')
    async update(
        @Param('id') conversationId: string,
        @Body() updateConversationDto: UpdateConversationDto,
        @Req() req: any,
    ) {
        console.log('📝 Update conversation received:', {
            conversationId,
            body: updateConversationDto,
        });

        return this.conversationsService.update(
            conversationId,
            updateConversationDto.name,
            req.user.id,
        );
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
     * Add participant(s) to a group conversation
     */
    @Post(':id/participants')
    async addParticipant(
        @Param('id') conversationId: string,
        @Body() body: { userId?: string; userIds?: string[] },
        @Req() req: any,
    ) {
        const userIds = body.userIds || (body.userId ? [body.userId] : []);
        return this.conversationsService.addParticipants(
            conversationId,
            userIds,
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

    /**
     * PATCH /api/conversations/:id/participants/:userId/role
     * Update a participant's role
     */
    @Patch(':id/participants/:userId/role')
    async updateParticipantRole(
        @Param('id') conversationId: string,
        @Param('userId') userId: string,
        @Body() updateRoleDto: UpdateParticipantRoleDto,
        @Req() req: any,
    ) {
        return this.conversationsService.updateParticipantRole(
            conversationId,
            userId,
            updateRoleDto.role,
            req.user.id,
        );
    }

}
