import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) {}

    // Create a new message
    async create(createMessageDto: CreateMessageDto, senderId: string) {
        const { content, conversationId } = createMessageDto;

        // Verify that sender is a participant of the conversation
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId: senderId,
            },
        });

        if (!participant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }

        // Create the message
        const message = await this.prisma.message.create({
        data: {
            content,
            conversationId,
            senderId,
        },
        include: {
            sender: {
                select: {
                    id: true,
                        clerkId: true,
                        email: true,
                        username: true,
                        imageUrl: true,
                },
            },
        },
    });

        // Update conversation updatedAt timestamp
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
    });

        return message;
    }

    // Get all messages for a conversation
    async findAllInConversation(conversationId: string, userId: string) {
        // Verify user is a participant
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId,
            },
        });

        if (!participant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }

        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        clerkId: true,
                        email: true,
                        username: true,
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

    // Update a message (only by sender)
    async update(id: string, updateMessageDto: UpdateMessageDto, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }

        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only edit your own messages');
        }

        const updatedMessage = await this.prisma.message.update({
            where: { id },
            data: updateMessageDto,
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        imageUrl: true,
                    },
                },
            },
        });

        return updatedMessage;
    }

    // Delete a message (only by sender)
    async remove(id: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }

        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        await this.prisma.message.delete({
            where: { id },
        });

        return { message: 'Message deleted successfully' };
    }
}
