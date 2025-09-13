import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Req
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('messages')
@UseGuards(ClerkAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get()
    getMessages(@Req() req: any) {
        // req.user contient les données utilisateur Clerk
        return this.messagesService.getUserMessages(req.user.id);
    }

    @Get('all')
    getAllMessages() {
        return this.messagesService.getAllMessages();
    }

    @Post()
    createMessage(
        @Body() createMessageDto: { content: string },
        @Req() req: any
    ) {
        return this.messagesService.createMessage(
            req.user.id,
            createMessageDto.content
        );
    }
}
