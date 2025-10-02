import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import {type ClerkClient, verifyToken} from '@clerk/backend';
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
        console.log('Authorization header:', authHeader?.substring(0, 50) + '...');

        const token = authHeader?.split(' ')[1];

        if (!token) {
            console.log('No token provided');
            throw new UnauthorizedException('No token provided');
        }

        console.log('Token received:', token.substring(0, 20) + '...');

        try {
            console.log('Verifying token with Clerk...');

            // Verify JWT token
            const payload = await verifyToken(token, {
                secretKey: this.configService.get('CLERK_SECRET_KEY'),
                audience: undefined,
                authorizedParties: undefined,
            });
            console.log('Token valid! User ID:', payload.sub);

            // Fetch full user details from Clerk
            const clerkUser = await this.clerkClient.users.getUser(payload.sub);
            console.log('User retrieved from Clerk:', clerkUser.emailAddresses[0]?.emailAddress);

            // Upsert user in local database
            const user = await this.prisma.user.upsert({
                where: { clerkId: clerkUser.id },
                update: {
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    username: clerkUser.username,
                    imageUrl: clerkUser.imageUrl,
                },
                create: {
                    clerkId: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    username: clerkUser.username,
                    imageUrl: clerkUser.imageUrl,
                },
            });

            console.log('User added in DB:', user.id, user.email);

            return user; // Attached to req.user with local DB id
        } catch (error) {
            console.error('Clerk authentication failed:', error.message);
            console.error('Error details:', error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
