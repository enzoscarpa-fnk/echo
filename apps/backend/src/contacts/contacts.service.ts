import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ContactStatus } from '@prisma/client';

@Injectable()
export class ContactsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Send a contact request
     */
    async sendRequest(initiatorId: string, receiverId: string) {
        // Can't add yourself
        if (initiatorId === receiverId) {
            throw new BadRequestException('Cannot add yourself as contact');
        }

        // Check if receiver exists
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });

        console.log('  Receiver found:', receiver ? 'YES' : 'NO');

        if (!receiver) {
            throw new NotFoundException('User not found');
        }

        // Check if contact already exists
        const existingContact = await this.prisma.contact.findFirst({
            where: {
                OR: [
                    { initiatorId, receiverId },
                    { initiatorId: receiverId, receiverId: initiatorId },
                ],
            },
        });

        console.log('  Existing contact:', existingContact);

        if (existingContact) {
            if (existingContact.status === ContactStatus.ACCEPTED) {
                throw new ConflictException('Already in contacts');
            }
            if (existingContact.status === ContactStatus.PENDING) {
                throw new ConflictException('Request already pending');
            }
        }

        // Create contact request
        const newContact = await this.prisma.contact.create({
        data: {
            initiatorId,
            receiverId,
            status: ContactStatus.PENDING,
        },
        include: {
            initiator: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                },
            },
        },
    });

        return newContact;
    }


    /**
     * Accept a contact request
     */
    async acceptRequest(userId: string, contactId: string) {
        const contact = await this.prisma.contact.findUnique({
            where: { id: contactId },
        });

        if (!contact) {
            throw new NotFoundException('Contact request not found');
        }

        // Only receiver can accept
        if (contact.receiverId !== userId) {
            throw new BadRequestException('Only receiver can accept this request');
        }

        if (contact.status !== ContactStatus.PENDING) {
            throw new BadRequestException('Request is not pending');
        }

        return this.prisma.contact.update({
            where: { id: contactId },
            data: { status: ContactStatus.ACCEPTED },
            include: {
                initiator: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
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
                        imageUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
            },
        });
    }

    /**
     * Reject/Cancel a contact request
     */
    async rejectRequest(userId: string, contactId: string) {
        const contact = await this.prisma.contact.findUnique({
            where: { id: contactId },
        });

        if (!contact) {
            throw new NotFoundException('Contact request not found');
        }

        // Only initiator or receiver can reject
        if (contact.initiatorId !== userId && contact.receiverId !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        return this.prisma.contact.delete({
            where: { id: contactId },
        });
    }

    /**
     * Get all ACCEPTED contacts for a user
     */
    async getMyContacts(userId: string) {
        const contacts = await this.prisma.contact.findMany({
            where: {
                status: ContactStatus.ACCEPTED,
                OR: [{ initiatorId: userId }, { receiverId: userId }],
            },
            include: {
                initiator: {
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
                receiver: {
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
        });

        // Return only the "other" user
        return contacts.map((contact) => {
            const isInitiator = contact.initiatorId === userId;
            return {
                contactId: contact.id,
                ...(isInitiator ? contact.receiver : contact.initiator),
            };
        });
    }

    /**
     * Get pending contact requests (received by user)
     */
    async getPendingRequests(userId: string) {
        const requests = await this.prisma.contact.findMany({
            where: {
                receiverId: userId,
                status: ContactStatus.PENDING,
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return requests.map((req) => ({
            contactId: req.id,
            ...req.initiator,
            requestedAt: req.createdAt,
        }));
    }

    /**
     * Get sent contact requests (initiated by user)
     */
    async getSentRequests(userId: string) {
        return this.prisma.contact.findMany({
            where: {
                initiatorId: userId,
                status: ContactStatus.PENDING,
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
