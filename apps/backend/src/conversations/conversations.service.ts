import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Create a new conversation (1:1 or group)
     */
    async create(currentUserId: string, createConversationDto: CreateConversationDto) {
        const { participantIds, name, isGroup } = createConversationDto;

        // Add current user to participants if not already included
        const allParticipantIds = [...new Set([currentUserId, ...participantIds])];

        // Validate participants exist
        const users = await this.prisma.user.findMany({
            where: { id: { in: allParticipantIds } },
        });

        if (users.length !== allParticipantIds.length) {
            throw new BadRequestException('One or more participants not found');
        }

        // For 1:1 conversations, check if conversation already exists
        if (!isGroup && allParticipantIds.length === 2) {
            const existingConversation = await this.findExistingOneToOne(allParticipantIds);
            if (existingConversation) {
                return existingConversation;
            }
        }

        // Validate group chat has a name
        if (isGroup && !name) {
            throw new BadRequestException('Group conversations must have a name');
        }

        // Create conversation with participants
        const conversation = await this.prisma.conversation.create({
        data: {
            name: isGroup ? name : null,
            isGroup: isGroup || false,
            participants: {
            create: allParticipantIds.map((userId) => ({
                userId,
            })),
        },
        },
        include: {
            participants: {
                include: {
                    user: true,
                },
            },
        },
    });

        return conversation;
    }

    /**
     * Find existing 1:1 conversation between two users
     */
    private async findExistingOneToOne(participantIds: string[]) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                isGroup: false,
                participants: {
                    every: {
                        userId: { in: participantIds },
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        // Filter to ensure exactly 2 participants
        return conversations.find((conv) => conv.participants.length === 2);
    }

    /**
     * Get all conversations for the current user
     */
    async findAll(currentUserId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: currentUserId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
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
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1, // Get last message
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return conversations;
    }

    /**
     * Get a single conversation by ID
     */
    async findOne(conversationId: string, currentUserId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: {
                        user: {
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
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if current user is a participant
        const isParticipant = conversation.participants.some(
            (p) => p.userId === currentUserId,
        );

        if (!isParticipant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }

        return conversation;
    }

    /**
     * Add a participant to a group conversation
     */
    async addParticipant(conversationId: string, userId: string, currentUserId: string) {
        const conversation = await this.findOne(conversationId, currentUserId);

        if (!conversation.isGroup) {
            throw new BadRequestException('Cannot add participants to 1:1 conversations');
        }

        // Check if user already a participant
        const alreadyParticipant = conversation.participants.some(
            (p) => p.userId === userId,
        );

        if (alreadyParticipant) {
            throw new BadRequestException('User is already a participant');
        }

        // Add participant
        await this.prisma.conversationParticipant.create({
        data: {
            conversationId,
            userId,
        },
    });

        return this.findOne(conversationId, currentUserId);
    }

    /**
     * Remove a participant from a group conversation
     */
    async removeParticipant(
        conversationId: string,
        userId: string,
        currentUserId: string,
    ) {
        const conversation = await this.findOne(conversationId, currentUserId);

        if (!conversation.isGroup) {
            throw new BadRequestException('Cannot remove participants from 1:1 conversations');
        }

        // Find participant
        const participant = conversation.participants.find((p) => p.userId === userId);

        if (!participant) {
            throw new NotFoundException('Participant not found');
        }

        // Delete participant
        await this.prisma.conversationParticipant.delete({
            where: { id: participant.id },
        });

        return { message: 'Participant removed successfully' };
    }

    /**
     * Delete/leave a conversation
     */
    async remove(conversationId: string, currentUserId: string) {
        const conversation = await this.findOne(conversationId, currentUserId);

        // Find current user's participant record
        const participant = conversation.participants.find(
            (p) => p.userId === currentUserId,
        );

        if (!participant) {
            throw new NotFoundException('You are not a participant of this conversation');
        }

        // Remove user from conversation
        await this.prisma.conversationParticipant.delete({
            where: { id: participant.id },
        });

        // If conversation has no more participants, delete it
        const remainingParticipants = await this.prisma.conversationParticipant.count({
            where: { conversationId },
        });

        if (remainingParticipants === 0) {
            await this.prisma.conversation.delete({
                where: { id: conversationId },
            });
        }

        return { message: 'Successfully left conversation' };
    }
}
