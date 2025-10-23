import {
    Controller,
    Post,
    Body,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Webhook } from 'svix';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private webhooksService: WebhooksService) {}

    @Post('clerk')
    @HttpCode(HttpStatus.OK)
    async handleClerkWebhook(
        @Body() body: any,
        @Headers('svix-id') svixId: string,
        @Headers('svix-timestamp') svixTimestamp: string,
        @Headers('svix-signature') svixSignature: string,
    ) {
        // Verify webhook signature for security
        const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

        if (!webhookSecret) {
            this.logger.error('Missing CLERK_WEBHOOK_SIGNING_SECRET');
            throw new BadRequestException('Webhook secret not configured');
        }

        try {
            // Create Svix webhook instance for verification
            const wh = new Webhook(webhookSecret);

            // Convert body to string if needed
            const payload = typeof body === 'string' ? body : JSON.stringify(body);

            // Verify the webhook signature
            const evt = wh.verify(payload, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            }) as any;

            this.logger.log(`Webhook received: ${evt.type}`);

            // Handle different event types
            switch (evt.type) {
                case 'user.created':
                    await this.webhooksService.handleUserCreated(evt.data);
                    break;

                case 'user.updated':
                    await this.webhooksService.handleUserUpdated(evt.data);
                    break;

                case 'user.deleted':
                    await this.webhooksService.handleUserDeleted(evt.data);
                    break;

                default:
                    this.logger.warn(`Unhandled webhook event type: ${evt.type}`);
            }

            return { success: true };
        } catch (error) {
            this.logger.error(
                `Webhook verification failed: ${error.message}`,
                error.stack,
            );
            throw new BadRequestException('Invalid webhook signature');
        }
    }
}
