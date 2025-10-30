import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PusherService } from "../pusher/pusher.service";

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private pusher: PusherService,
    ) {}

    /**
     * Send a message in a conversation
     */
    async create(
        conversationId: string,
        currentUserId: string,
        createMessageDto: CreateMessageDto,
    ) {
        // Verify user is participant of the conversation
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId: currentUserId,
            },
        });

        if (!participant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }

        // Create message
        const message = await this.prisma.message.create({
            data: {
                content: createMessageDto.content,
                conversationId,
                senderId: currentUserId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        clerkId: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },
            },
        });

        // Update conversation's updatedAt timestamp
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        // ✅ TRIGGER PUSHER
        console.log('🚀 Triggering Pusher event:', {
            channel: `conversation-${conversationId}`,
            event: 'new-message',
            messageId: message.id,
        });

        // Pusher event
        await this.pusher.trigger(
            `conversation-${conversationId}`,
            'new-message',
            message,
        );

        return message;
    }

    /**
     * Get all messages in a conversation
     */
    async findAll(conversationId: string, currentUserId: string) {
        // Verify user is participant of the conversation
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId: currentUserId,
            },
        });

        if (!participant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }

        // Get messages
        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        clerkId: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return messages;
    }

    /**
     * Get a single message by ID
     */
    async findOne(messageId: string, currentUserId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                sender: {
                    select: {
                        id: true,
                        clerkId: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },
                conversation: {
                    include: {
                        participants: true,
                    },
                },
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Check if user is participant
        const isParticipant = message.conversation.participants.some(
            (p) => p.userId === currentUserId,
        );

        if (!isParticipant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }

        return message;
    }

    /**
     * Update a message (only by sender)
     */
    async update(
        messageId: string,
        currentUserId: string,
        updateMessageDto: UpdateMessageDto,
    ) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only sender can edit message
        if (message.senderId !== currentUserId) {
            throw new ForbiddenException('You can only edit your own messages');
        }

        // Update message
        const updatedMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: { content: updateMessageDto.content },
            include: {
                sender: {
                    select: {
                        id: true,
                        clerkId: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },
            },
        });

        // Trigger Pusher event
        await this.pusher.trigger(
            `conversation-${message.conversationId}`,
            'message-updated',
            updatedMessage,
        );

        return updatedMessage;
    }

    /**
     * Delete a message (only by sender)
     */
    async remove(messageId: string, currentUserId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only sender can delete message
        if (message.senderId !== currentUserId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        // Delete message
        await this.prisma.message.delete({
            where: { id: messageId },
        });

        // Trigger Pusher event
        await this.pusher.trigger(
            `conversation-${message.conversationId}`,
            'message-deleted',
            { messageId },
        );

        return { message: 'Message deleted successfully' };
    }

    /**
     * Mark messages as read (update lastReadAt)
     */
    async markAsRead(conversationId: string, currentUserId: string) {
        await this.prisma.conversationParticipant.updateMany({
            where: {
                conversationId,
                userId: currentUserId,
            },
            data: {
                lastReadAt: new Date(),
            },
        });

        return { message: 'Messages marked as read' };
    }
}
