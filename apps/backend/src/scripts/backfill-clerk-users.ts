/**
 * RUN SCRIPT FROM PROJECT ROOT TO BACKFILL
 * cd apps/backend
 * npx ts-node -r tsconfig-paths/register src/scripts/backfill-clerk-users.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { ClerkClient } from '@clerk/backend';
import { CLERK_CLIENT_TOKEN } from '../auth/clerk-client.provider';

/**
 * Backfill script to sync all Clerk users to local database
 * Run with: npx ts-node src/scripts/backfill-clerk-users.ts
 */
async function backfillClerkUsers() {
    console.log('🚀 Starting Clerk users backfill...\n');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const clerkClient = app.get<ClerkClient>(CLERK_CLIENT_TOKEN);

    try {
        // Fetch all users from Clerk (paginated)
        let hasMore = true;
        let offset = 0;
        const limit = 100;
        let totalProcessed = 0;
        let totalCreated = 0;
        let totalUpdated = 0;

        while (hasMore) {
            console.log(`📥 Fetching users (offset: ${offset}, limit: ${limit})...`);

            const clerkUsers = await clerkClient.users.getUserList({
                limit,
                offset,
            });

            console.log(`✅ Fetched ${clerkUsers.data.length} users from Clerk`);

            for (const clerkUser of clerkUsers.data) {
                try {
                    // Check if user already exists in database
                    const existingUser = await prisma.user.findUnique({
                        where: { clerkId: clerkUser.id },
                    });

                    // Upsert user
                    const user = await prisma.user.upsert({
                        where: { clerkId: clerkUser.id },
                        update: {
                            email: clerkUser.emailAddresses[0]?.emailAddress || '',
                            username: clerkUser.username || clerkUser.firstName || null,
                            firstName: clerkUser.firstName || null,
                            lastName: clerkUser.lastName || null,
                            imageUrl: clerkUser.imageUrl || null,
                        },
                        create: {
                            clerkId: clerkUser.id,
                            email: clerkUser.emailAddresses[0]?.emailAddress || '',
                            username: clerkUser.username || clerkUser.firstName || null,
                            firstName: clerkUser.firstName || null,
                            lastName: clerkUser.lastName || null,
                            imageUrl: clerkUser.imageUrl || null,
                        },
                    });

                    if (existingUser) {
                        console.log(`  ♻️  Updated: ${user.email} (${user.id})`);
                        totalUpdated++;
                    } else {
                        console.log(`  ✨ Created: ${user.email} (${user.id})`);
                        totalCreated++;
                    }

                    totalProcessed++;
                } catch (error) {
                    console.error(
                        `  ❌ Error processing user ${clerkUser.id}: ${error.message}`,
                    );
                }
            }

            // Check if there are more users to fetch
            hasMore = clerkUsers.data.length === limit;
            offset += limit;

            console.log(''); // Empty line for readability
        }

        console.log('✅ Backfill completed!\n');
        console.log(`📊 Summary:`);
        console.log(`   Total processed: ${totalProcessed}`);
        console.log(`   Created: ${totalCreated}`);
        console.log(`   Updated: ${totalUpdated}`);
    } catch (error) {
        console.error('❌ Backfill failed:', error);
        throw error;
    } finally {
        await app.close();
    }
}

// Run the backfill
backfillClerkUsers()
    .then(() => {
        console.log('\n🎉 Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
