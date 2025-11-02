import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

export const PUSHER_PROVIDER = 'PUSHER_PROVIDER';

export const PusherProvider: Provider = {
    provide: PUSHER_PROVIDER,
    useFactory: (configService: ConfigService): Pusher => {
        return new Pusher({
            appId: configService.get<string>('PUSHER_APP_ID'),
            key: configService.get<string>('PUSHER_KEY'),
            secret: configService.get<string>('PUSHER_SECRET'),
            cluster: configService.get<string>('PUSHER_CLUSTER'),
            useTLS: true,
        });
    },
    inject: [ConfigService],
};
