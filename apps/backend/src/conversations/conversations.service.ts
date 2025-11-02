import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MemberRole } from '@prisma/client';

@Injectable()
export class ConversationsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Create a new conversation (1:1 or group)
     */
    async create(currentUserId: string, createConversationDto: CreateConversationDto) {
        const { participantIds, name, isGroup } = createConversationDto;

        // Add current user to participants if not already included
        const allParticipantIds = [...new Set([currentUserId, ...(participantIds || [])])];

        // Remove current user from the list to validate only invited participants
        const invitedParticipantIds = allParticipantIds.filter(id => id !== currentUserId);

        // Validate that all invited participants are accepted contacts
        if (invitedParticipantIds.length > 0) {
            const contacts = await this.prisma.contact.findMany({
                where: {
                    status: 'ACCEPTED',
                    OR: [
                        { initiatorId: currentUserId, receiverId: { in: invitedParticipantIds } },
                        { initiatorId: { in: invitedParticipantIds }, receiverId: currentUserId },
                    ],
                },
            });

            if (contacts.length !== invitedParticipantIds.length) {
                throw new BadRequestException('All participants must be accepted contacts');
            }
        }

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

        // Create conversation with participants (creator is ADMIN, others are MEMBER)
        const conversation = await this.prisma.conversation.create({
            data: {
                name: isGroup ? name : null,
                isGroup: isGroup || false,
                participants: {
                create: allParticipantIds.map((userId) => ({
                    userId,
                    role: userId === currentUserId ? MemberRole.ADMIN : MemberRole.MEMBER,
                })),
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
                                isOnline: true,
                                lastSeenAt: true,
                            },
                        },
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
                        user: {
                            select: {
                                id: true,
                                clerkId: true,
                                email: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                imageUrl: true,
                                isOnline: true,
                                lastSeenAt: true,
                            },
                        },
                    },
                },
            },
        });

        // Filter to ensure exactly 2 participants
        return conversations.find((conv) => conv.participants.length === 2);
    }

    /**
     * Find or create a 1:1 conversation with a contact
     * Simplified method for direct contact-to-chat navigation
     */
    async findOrCreateWithContact(currentUserId: string, contactId: string) {
        // Validate that users are accepted contacts
        const areContacts = await this.prisma.contact.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { initiatorId: currentUserId, receiverId: contactId },
                    { initiatorId: contactId, receiverId: currentUserId },
                ],
            },
        });

        if (!areContacts) {
            throw new ForbiddenException('Users are not accepted contacts');
        }

        // Try to find existing 1:1 conversation
        const participantIds = [currentUserId, contactId];
        const existingConversation = await this.findExistingOneToOne(participantIds);

        if (existingConversation) {
            return existingConversation;
        }

        // Create new 1:1 conversation
        const conversation = await this.prisma.conversation.create({
        data: {
            isGroup: false,
                participants: {
                create: [
                    { userId: currentUserId, role: MemberRole.MEMBER },
                    { userId: contactId, role: MemberRole.MEMBER },
                ],
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
                            isOnline: true,
                            lastSeenAt: true,
                        },
                    },
                },
            },
        },
    });

        return conversation;
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
                                isOnline: true,
                                lastSeenAt: true,
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
                                isOnline: true,
                                lastSeenAt: true,
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
     * Add a participant to a group conversation (with contact validation)
     */
    async addParticipant(conversationId: string, userId: string, currentUserId: string) {
        const conversation = await this.findOne(conversationId, currentUserId);

        if (!conversation.isGroup) {
            throw new BadRequestException('Cannot add participants to 1:1 conversations');
        }

        // Check if current user has ADMIN role
        const currentUserParticipant = conversation.participants.find(
            (p) => p.userId === currentUserId,
        );

        if (!currentUserParticipant || currentUserParticipant.role !== MemberRole.ADMIN) {
            throw new ForbiddenException('Only admins can add participants to group conversations');
        }

        // Check if user already a participant
        const alreadyParticipant = conversation.participants.some(
            (p) => p.userId === userId,
        );

        if (alreadyParticipant) {
            throw new BadRequestException('User is already a participant');
        }

        // Validate that the user is an accepted contact
        const contact = await this.prisma.contact.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { initiatorId: currentUserId, receiverId: userId },
                    { initiatorId: userId, receiverId: currentUserId },
                ],
            },
        });

        if (!contact) {
            throw new BadRequestException('User must be an accepted contact to be added');
        }

        // Add participant with MEMBER role
        await this.prisma.conversationParticipant.create({
            data: {
                conversationId,
                    userId,
                    role: MemberRole.MEMBER,
            },
        });

        return this.findOne(conversationId, currentUserId);
    }

    /**
     * Add multiple participants to a group conversation
     */
    async addParticipants(
        conversationId: string,
        userIds: string[],
        currentUserId: string,
    ) {
        const conversation = await this.findOne(conversationId, currentUserId);

        if (!conversation.isGroup) {
            throw new BadRequestException('Cannot add participants to 1:1 conversations');
        }

        // Check if current user has ADMIN role
        const currentUserParticipant = conversation.participants.find(
            (p) => p.userId === currentUserId,
        );

        if (!currentUserParticipant || currentUserParticipant.role !== MemberRole.ADMIN) {
            throw new ForbiddenException('Only admins can add participants to group conversations');
        }

        // Add each participant
        for (const userId of userIds) {
            // Check if already participant
            const alreadyParticipant = conversation.participants.some(
                (p) => p.userId === userId,
            );

            if (alreadyParticipant) {
                continue; // Skip if already participant
            }

            // Validate that the user is an accepted contact
            const contact = await this.prisma.contact.findFirst({
                where: {
                    status: 'ACCEPTED',
                    OR: [
                        { initiatorId: currentUserId, receiverId: userId },
                        { initiatorId: userId, receiverId: currentUserId },
                    ],
                },
            });

            if (!contact) {
                throw new BadRequestException(
                    `User ${userId} must be an accepted contact to be added`,
                );
            }

            // Add participant with MEMBER role
            await this.prisma.conversationParticipant.create({
            data: {
                conversationId,
                userId,
                role: MemberRole.MEMBER,
                },
            });
        }

        return this.findOne(conversationId, currentUserId);
    }

    /**
     * Remove a participant from a group conversation (with role validation)
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

        // Check if current user has ADMIN role or is removing themselves
        const currentUserParticipant = conversation.participants.find(
            (p) => p.userId === currentUserId,
        );

        const isSelfRemoval = userId === currentUserId;
        const isAdmin = currentUserParticipant?.role === MemberRole.ADMIN;

        if (!isSelfRemoval && !isAdmin) {
            throw new ForbiddenException('Only admins can remove other participants');
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
     * Update conversation name (rename)
     */
    async update(
        conversationId: string,
        name: string,
        currentUserId: string,
    ) {
        console.log('🔍 Service update called:', { conversationId, name, currentUserId });

        const conversation = await this.findOne(conversationId, currentUserId);
        console.log('📌 Conversation found:', { isGroup: conversation.isGroup });

        const currentUserParticipant = conversation.participants.find(
            (p) => p.userId === currentUserId,
        );

        if (conversation.isGroup) {
            if (!currentUserParticipant || currentUserParticipant.role !== MemberRole.ADMIN) {
                throw new ForbiddenException('Only admins can rename group conversations');
            }
        } else {
            if (!currentUserParticipant) {
                throw new ForbiddenException('You are not a participant of this conversation');
            }
        }

        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { name },
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
                                isOnline: true,
                                lastSeenAt: true,
                            },
                        },
                    },
                },
            },
        });
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

    /**
     * Update participant role (ADMIN only)
     */
    async updateParticipantRole(
        conversationId: string,
        userId: string,
        newRole: MemberRole,
        currentUserId: string,
    ) {
        const conversation = await this.findOne(conversationId, currentUserId);

        if (!conversation.isGroup) {
            throw new BadRequestException('Cannot change roles in 1:1 conversations');
        }

        // Check if current user is ADMIN
        const currentUserParticipant = conversation.participants.find(
            (p) => p.userId === currentUserId,
        );

        if (!currentUserParticipant || currentUserParticipant.role !== MemberRole.ADMIN) {
            throw new ForbiddenException('Only admins can change participant roles');
        }

        // Find target participant
        const targetParticipant = conversation.participants.find((p) => p.userId === userId);

        if (!targetParticipant) {
            throw new NotFoundException('Participant not found');
        }

        // Update role
        await this.prisma.conversationParticipant.update({
            where: { id: targetParticipant.id },
            data: { role: newRole },
        });

        return this.findOne(conversationId, currentUserId);
    }

}
