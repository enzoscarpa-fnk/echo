import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
    constructor(private readonly prisma: PrismaService) {}

    // Create a new conversation with participants
    async create(createConversationDto: CreateConversationDto, currentUserId: string) {
        const { participantIds, name, isGroup } = createConversationDto;

        // If participantIds is undefined, use empty array
        const participants = participantIds || [];

        // Add current user to participants if not already included
        const allParticipantIds = [...new Set([currentUserId, ...participants])];

        // Validate that all users exist
        const users = await this.prisma.user.findMany({
            where: { id: { in: allParticipantIds } },
        });

        if (users.length !== allParticipantIds.length) {
            throw new BadRequestException('One or more user IDs are invalid');
        }

        // Create conversation with participants
        const conversation = await this.prisma.conversation.create({
        data: {
            name,
            isGroup: isGroup ?? false,
            participants: {
            create: allParticipantIds.map((userId) => ({
                userId,
            })),
        }},
        include: {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                                clerkId: true,
                                email: true,
                                username: true,
                                imageUrl: true,
                        },
                    },
                },
            },
        },
    });


        return conversation;
    }

    // Get all conversations for a user
    async findAllForUser(userId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId,
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
                                imageUrl: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                imageUrl: true,
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

    // Get a single conversation by ID
    async findOne(id: string, userId: string) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId,
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
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }

        return conversation;
    }

    // Delete a conversation (only if user is participant)
    async remove(id: string, userId: string) {
        const conversation = await this.findOne(id, userId);

        await this.prisma.conversation.delete({
            where: { id: conversation.id },
        });

        return { message: 'Conversation deleted successfully' };
    }
}
