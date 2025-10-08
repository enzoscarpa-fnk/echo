import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Handle user.created event from Clerk
     * Creates a new user in our database
     */
    async handleUserCreated(data: any) {
        try {
            const user = await this.prisma.user.upsert({
                where: { clerkId: data.id },
                update: {
                    email: data.email_addresses?.[0]?.email_address || '',
                    username: data.username || data.first_name || null,
                    firstName: data.first_name || null,
                    lastName: data.last_name || null,
                    imageUrl: data.image_url || null,
                },
                create: {
                    clerkId: data.id,
                    email: data.email_addresses?.[0]?.email_address || '',
                    username: data.username || data.first_name || null,
                    firstName: data.first_name || null,
                    lastName: data.last_name || null,
                    imageUrl: data.image_url || null,
                },
            });

            this.logger.log(`User created: ${user.id} (Clerk ID: ${user.clerkId})`);
            return user;
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Handle user.updated event from Clerk
     * Updates user data in our database
     */
    async handleUserUpdated(data: any) {
        try {
            const user = await this.prisma.user.update({
                where: { clerkId: data.id },
                data: {
                    email: data.email_addresses?.[0]?.email_address || undefined,
                    username: data.username || data.first_name || undefined,
                    firstName: data.first_name || undefined,
                    lastName: data.last_name || undefined,
                    imageUrl: data.image_url || undefined,
                },
            });

            this.logger.log(`User updated: ${user.id} (Clerk ID: ${user.clerkId})`);
            return user;
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Handle user.deleted event from Clerk
     * Soft delete or hard delete user from our database
     */
    async handleUserDeleted(data: any) {
        try {
            const user = await this.prisma.user.delete({
                where: { clerkId: data.id },
            });

            this.logger.log(`User deleted: ${user.id} (Clerk ID: ${user.clerkId})`);
            return user;
        } catch (error) {
            this.logger.error(`Error deleting user: ${error.message}`, error.stack);
            throw error;
        }
    }
}