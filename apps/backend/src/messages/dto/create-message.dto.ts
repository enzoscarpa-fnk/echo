import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsUUID('4')
    conversationId: string;

    // senderId will come from Clerk auth (req.user)
}
