import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ConversationsService } from '../services/conversations.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { ClerkAuthGuard } from '../../auth/clerk-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(ClerkAuthGuard) // All routes require authentication
export class ConversationsController {
    constructor(
        private readonly conversationsService: ConversationsService,
    ) {}

    // POST /conversations - Create a new conversation
    @Post()
    create(
        @Body() createConversationDto: CreateConversationDto,
        @CurrentUser() user: any,
    ) {
        return this.conversationsService.create(createConversationDto, user.id);
    }

    // GET /conversations - Get all conversations for current user
    @Get()
    findAll(@CurrentUser() user: any) {
        return this.conversationsService.findAllForUser(user.id);
    }

    // GET /conversations/:id - Get a single conversation
    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.conversationsService.findOne(id, user.id);
    }

    // DELETE /conversations/:id - Delete a conversation
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.conversationsService.remove(id, user.id);
    }
}
