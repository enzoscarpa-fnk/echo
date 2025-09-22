// src/messages/messages.service.ts
/*import { Injectable } from '@nestjs/common';

export interface Message {
    id: string;
    userId: string;
    content: string;
    timestamp: Date;
}

@Injectable()
export class MessagesService {
    private messages: Message[] = [];

    getUserMessages(userId: string): Message[] {
        return this.messages.filter(message => message.userId === userId);
    }

    getAllMessages(): Message[] {
        return this.messages;
    }

    createMessage(userId: string, content: string): Message {
        const message: Message = {
            id: Date.now().toString(),
            userId,
            content,
            timestamp: new Date(),
        };
        this.messages.push(message);
        return message;
    }
}
*/
