import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../database/prisma.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class ClerkAuthGuard extends AuthGuard('clerk') {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    @Inject('ClerkClient') private clerkClient: any,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Step 1: Verify JWT token with Clerk Passport Strategy
    const isAuthenticated = (await super.canActivate(context)) as boolean;

    if (!isAuthenticated) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.auth?.userId; // Clerk user ID from verified JWT

    if (!clerkUserId) {
      throw new UnauthorizedException('No user ID found in token');
    }

    // Step 2: Try to find user in database (webhook may have created it)
    let user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    // Step 3: If user doesn't exist, perform Just-In-Time provisioning
    if (!user) {
      this.logger.warn(
        `User ${clerkUserId} not found in database. Performing Just-In-Time provisioning...`,
      );

      try {
        // Fetch user data from Clerk API
        const clerkUser = await this.clerkClient.users.getUser(clerkUserId);

        // Create user in database
        user = await this.prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            username: clerkUser.username || clerkUser.firstName || null,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            imageUrl: clerkUser.imageUrl || null,
          },
        });

        this.logger.log(
          `✅ User created via JIT provisioning: ${user.id} (Clerk ID: ${user.clerkId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to provision user ${clerkUserId} from Clerk API:`,
          error.message,
        );
        throw new UnauthorizedException(
          'Failed to provision user account. Please try again.',
        );
      }
    }

    // Step 4: Attach full user object to request for downstream use
    request.user = user;

    return true;
  }
}
