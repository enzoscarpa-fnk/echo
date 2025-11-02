import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('contacts')
@UseGuards(ClerkAuthGuard)
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    /**
     * GET /api/contacts
     * Get all accepted contacts
     */
    @Get()
    async getMyContacts(@Req() req: any) {
        return this.contactsService.getMyContacts(req.user.id);
    }

    /**
     * GET /api/contacts/pending
     * Get pending contact requests (received)
     */
    @Get('pending')
    async getPendingRequests(@Req() req: any) {
        return this.contactsService.getPendingRequests(req.user.id);
    }

    /**
     * GET /api/contacts/sent
     * Get sent contact requests
     */
    @Get('sent')
    async getSentRequests(@Req() req: any) {
        return this.contactsService.getSentRequests(req.user.id);
    }

    /**
     * POST /api/contacts/request/:userId
     * Send contact request to a user
     */
    @Post('request/:userId')
    async sendRequest(@Req() req: any, @Param('userId') userId: string) {
        const result = await this.contactsService.sendRequest(req.user.id, userId);

        return result;
    }


    /**
     * POST /api/contacts/accept/:contactId
     * Accept a contact request
     */
    @Post('accept/:contactId')
    async acceptRequest(@Req() req: any, @Param('contactId') contactId: string) {
        return this.contactsService.acceptRequest(req.user.id, contactId);
    }

    /**
     * DELETE /api/contacts/:contactId
     * Reject/Remove a contact
     */
    @Delete(':contactId')
    async rejectRequest(@Req() req: any, @Param('contactId') contactId: string) {
        return this.contactsService.rejectRequest(req.user.id, contactId);
    }
}
