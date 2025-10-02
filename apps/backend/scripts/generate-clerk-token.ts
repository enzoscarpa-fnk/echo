import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

async function generateToken() {
    try {
        // Check if key is loaded
        if (!process.env.CLERK_SECRET_KEY) {
            console.log('CLERK_SECRET_KEY not found in .env');
            return;
        }

        console.log('Clerk Secret Key detected (begins with: ' + process.env.CLERK_SECRET_KEY.substring(0, 10) + '...)');
        console.log('Looking for users\n');

        // Retrieve users list
        const users = await clerkClient.users.getUserList();

        if (users.data.length === 0) {
            console.log('User not found. Create a user in the Clerk Dashboard first.');
            return;
        }

        const user = users.data[0];
        console.log(`\nUser found: ${user.emailAddresses[0]?.emailAddress}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Username: ${user.username || 'N/A'}\n`);

        // Create user sessions
        const session = await clerkClient.sessions.createSession({
            userId: user.id,
        });

        // Retrieve session's token
        const token = await clerkClient.sessions.getToken(session.id, 'echo-backend');

        console.log(`\nJWT token generated:\n`);
        console.log(token);
        console.log(`\nCopy this token in api-requests.http`);

    } catch (error) {
        console.error('Error:', error);
    }
}

generateToken();
