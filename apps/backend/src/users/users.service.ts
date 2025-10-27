import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '@prisma/client';
import Pusher from 'pusher';
import { PUSHER_PROVIDER } from './pusher.provider';
import {UpdateUserDto} from "./dto/update-user.dto";

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        @Inject(PUSHER_PROVIDER)
        private pusher: Pusher,
    ) {}

    /**
     * Get all users (excluding the current user)
     */
    async findAll(currentUserId: string): Promise<User[]> {
        return this.prisma.user.findMany({
            where: {
                id: { not: currentUserId },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                clerkId: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                createdAt: true,
                isOnline: true,
                lastSeenAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Get a single user by ID
     */
    async findOne(id: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                clerkId: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                createdAt: true,
                isOnline: true,
                lastSeenAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    /**
     * Get a user by Clerk ID
     */
    async findByClerkId(clerkId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { clerkId },
            select: {
                id: true,
                clerkId: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                createdAt: true,
                isOnline: true,
                lastSeenAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
        }

        return user;
    }

    /**
     * Search users by name or email
     */
    async search(query: string, currentUserId: string): Promise<User[]> {
        if (!query?.trim()) return [];

        return this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    {
                        OR: [
                            { email: { contains: query } },
                            { username: { contains: query } },
                            { firstName: { contains: query } },
                            { lastName: { contains: query } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                clerkId: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                createdAt: true,
                isOnline: true,
                lastSeenAt: true,
                updatedAt: true,
            },
            take: 10,// Limit results
        });
    }

    /**
     * Update user profile (local fields only)
     */
    async updateProfile(userId: string, data:UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                    lastName: data.lastName,
            },
            select: {
                id: true,
                    clerkId: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                    createdAt: true,
                    isOnline: true,
                    lastSeenAt: true,
                    updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Get all contacts (users except current user)
     */
    async getContacts(currentUserId: string) {
        return this.prisma.user.findMany({
            where: {
                id: {
                    not: currentUserId, // Exclude current user
                },
            },
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
            orderBy: [
                { isOnline: 'desc' }, // Online users first
                { username: 'asc' },  // Then alphabetically
            ],
        });
    }

    /**
     * Set user status to online
     * Called when user logs in or reconnects
     */
    async setUserOnline(userId: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: true,
                lastSeenAt: new Date(),
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                isOnline: true,
                lastSeenAt: true,
            },
        });

        // Notify all contacts that this user is now online
        await this.notifyContactsStatusChange(userId, true);

        return user;
    }

    /**
     * Set user status to offline
     * Called when user logs out or closes browser
     */
    async setUserOffline(userId: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: false,
                lastSeenAt: new Date(),
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                isOnline: true,
                lastSeenAt: true,
            },
        });

        // Notify all contacts that this user is now offline
        await this.notifyContactsStatusChange(userId, false);

        return user;
    }

    /**
     * Update last seen timestamp (heartbeat)
     * Called every 30 seconds while user is active
     */
    async updateLastSeen(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                lastSeenAt: new Date(),
            },
            select: {
                id: true,
                lastSeenAt: true,
            },
        });
    }

    /**
     * Get user status by ID
     */
    async getUserStatus(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                isOnline: true,
                lastSeenAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /**
     * Get online status of all user's contacts
     */
    async getContactsStatus(userId: string) {
        // Get all accepted contacts
        const contacts = await this.prisma.contact.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ initiatorId: userId }, { receiverId: userId }],
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        imageUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        imageUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
            },
        });

        // Format to return the "other" user with their status
        return contacts.map((contact) => {
            const contactUser =
                contact.initiatorId === userId
                    ? contact.receiver
                    : contact.initiator;

            return {
                ...contactUser,
                contactId: contact.id,
            };
        });
    }

    /**
     * Notify all contacts when user status changes
     * Sends real-time updates via Pusher
     */
    private async notifyContactsStatusChange(userId: string, isOnline: boolean) {
        // Get user's accepted contacts
        const contacts = await this.prisma.contact.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ initiatorId: userId }, { receiverId: userId }],
            },
        });

        // Extract contact IDs (the "other" user in each contact relationship)
        const contactIds = contacts.map((contact) =>
            contact.initiatorId === userId
                ? contact.receiverId
                : contact.initiatorId,
        );

        // Send status update to each contact via Pusher
        const statusUpdate = {
            userId,
            isOnline,
            lastSeenAt: new Date().toISOString(),
        };

        // Trigger event for each contact on their personal channel
        for (const contactId of contactIds) {
            await this.pusher.trigger(
                `private-user-${contactId}`,
                'contact-status-changed',
                statusUpdate,
            );
        }
    }

    // ==========================================
    // PUSHER AUTHORIZATION
    // ==========================================

    /**
     * Authorize Pusher channel subscription
     * Called when client tries to subscribe to private/presence channels
     */
    async authorizeChannel(socketId: string, channelName: string, userId: string) {
        // For private channels (user's personal channel)
        if (channelName.startsWith('private-user-')) {
            const channelUserId = channelName.replace('private-user-', '');

            // User can only subscribe to their own private channel
            if (channelUserId !== userId) {
                throw new Error('Unauthorized: Cannot subscribe to another user\'s channel');
            }

            return this.pusher.authorizeChannel(socketId, channelName);
        }

        // For presence channels (online users)
        if (channelName.startsWith('presence-')) {
            // Get user info
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                },
            });

            if (!user) {
                throw new Error('User not found');
            }

            const presenceData = {
                user_id: user.id,
                user_info: {
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    imageUrl: user.imageUrl,
                },
            };

            return this.pusher.authorizeChannel(
                socketId,
                channelName,
                presenceData,
            );
        }

        throw new Error('Invalid channel: Must start with private-user- or presence-');
    }
}
