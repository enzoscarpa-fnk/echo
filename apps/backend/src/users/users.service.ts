import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

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
        });
    }

    /**
     * Get a single user by ID
     */
    async findOne(id: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id },
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
            take: 10, // Limit results
        });
    }
}
