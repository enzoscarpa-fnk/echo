import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkClient, createClerkClient } from '@clerk/backend';

export const CLERK_CLIENT_TOKEN = 'ClerkClient';

export const ClerkClientProvider: Provider = {
    provide: CLERK_CLIENT_TOKEN,
    useFactory: (configService: ConfigService): ClerkClient => {
        return createClerkClient({
            secretKey: configService.get<string>('CLERK_SECRET_KEY'),
        });
    },
    inject: [ConfigService],
};
