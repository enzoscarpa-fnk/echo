import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { type ClerkClient, verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
    constructor(
        @Inject('ClerkClient')
        private readonly clerkClient: ClerkClient,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super();
    }

    async validate(req: Request): Promise<any> {
        const authHeader = req.headers.authorization;

        const token = authHeader?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            // Verify JWT token
            const payload = await verifyToken(token, {
                secretKey: this.configService.get('CLERK_SECRET_KEY'),
                audience: undefined,
                authorizedParties: undefined,
            });

            // Fetch full user details from Clerk
            const clerkUser = await this.clerkClient.users.getUser(payload.sub);

            // Upsert user in local database with all fields
            const user = await this.prisma.user.upsert({
                where: { clerkId: clerkUser.id },
                update: {
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    username: clerkUser.username,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                    // Update last seen on every authenticated request
                    lastSeenAt: new Date(),
                    isOnline: true,
                },
                create: {
                    clerkId: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    username: clerkUser.username,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                    isOnline: true,
                    lastSeenAt: new Date(),
                },
            });

            // Return user object that will be attached to req.user
            return {
                id: user.id,
                clerkId: user.clerkId,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                isOnline: user.isOnline,
                lastSeenAt: user.lastSeenAt,
            };
        } catch (error) {
            console.error('Clerk authentication failed:', error.message);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
